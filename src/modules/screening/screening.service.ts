import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorScreeningRequestDetailResponseDto } from './dtos/advisor-screening-request-detail-response.dto';
import { AdvisorScreeningRequestResponseDto } from './dtos/advisor-screening-request-response.dto';
import { DeclineScreeningRequestDto } from './dtos/decline-screening-request.dto';
import { ReplaceScreeningQuestionsDto } from './dtos/replace-screening-questions.dto';
import { ScreeningQuestionResponseDto } from './dtos/screening-question-response.dto';
import { ScreeningRequestQueryDto } from './dtos/screening-request-query.dto';
import { ScreeningRequestResponseDto } from './dtos/screening-request-response.dto';
import { ServiceScreeningResponseDto } from './dtos/service-screening-response.dto';
import { SubmitScreeningAnswersDto } from './dtos/submit-screening-answers.dto';
import {
  SCREENING_MESSAGES,
  SCREENING_NOTIFICATIONS,
} from './screening.constants';
import { ScreeningRepository } from './screening.repository';
import type {
  AdvisorScreeningRequestRow,
  ScreeningAnswerInput,
  ScreeningQuestion,
} from './screening.types';

@Injectable()
export class ScreeningService {
  constructor(private readonly repository: ScreeningRepository) {}

  /* ----------------------------------------------------------------- advisor */

  async findQuestions(
    user: SessionUser,
    serviceId: string,
  ): Promise<ScreeningQuestionResponseDto[]> {
    await this.getOwnedService(user.id, serviceId);
    const questions = await this.repository.findActiveQuestions(serviceId);
    return questions.map(
      (question) => new ScreeningQuestionResponseDto(question),
    );
  }

  async replaceQuestions(
    user: SessionUser,
    serviceId: string,
    dto: ReplaceScreeningQuestionsDto,
  ): Promise<ScreeningQuestionResponseDto[]> {
    await this.getOwnedService(user.id, serviceId);
    const questions = await this.repository.replaceQuestions(
      serviceId,
      dto.questions.map((question) => ({
        question: question.question,
        isRequired: question.isRequired,
      })),
    );
    return questions.map(
      (question) => new ScreeningQuestionResponseDto(question),
    );
  }

  findRequests(
    user: SessionUser,
    query: ScreeningRequestQueryDto,
  ): Promise<PaginatedResult<AdvisorScreeningRequestResponseDto>> {
    return paginateQuery(
      query,
      (options) =>
        this.repository.findManyForAdvisor(user.id, query.status, options),
      () => this.repository.countForAdvisor(user.id, query.status),
      (row) => new AdvisorScreeningRequestResponseDto(row),
    );
  }

  /** Opening a request is what clears its unread dot. */
  async findRequest(
    user: SessionUser,
    requestId: string,
  ): Promise<AdvisorScreeningRequestDetailResponseDto> {
    const row = await this.getAdvisorRequest(user.id, requestId);
    const viewedAt =
      row.viewedAt ?? (await this.repository.markViewed(requestId));
    const answers = await this.repository.findAnswers(requestId);
    return new AdvisorScreeningRequestDetailResponseDto(
      { ...row, viewedAt },
      answers,
    );
  }

  accept(
    user: SessionUser,
    requestId: string,
  ): Promise<AdvisorScreeningRequestResponseDto> {
    return this.decide(user, requestId, 'ACCEPTED', null);
  }

  decline(
    user: SessionUser,
    requestId: string,
    dto: DeclineScreeningRequestDto,
  ): Promise<AdvisorScreeningRequestResponseDto> {
    return this.decide(user, requestId, 'DECLINED', dto.message || null);
  }

  /* ----------------------------------------------------------------- advisee */

  /** The questions to answer and the caller's latest request, for the Advisee's screens. */
  async findForService(
    user: SessionUser,
    serviceId: string,
  ): Promise<ServiceScreeningResponseDto> {
    const service = await this.repository.findPublishedService(serviceId);
    if (!service) {
      throw new NotFoundException(SCREENING_MESSAGES.serviceNotFound);
    }
    const [questions, request] = await Promise.all([
      service.screeningRequired
        ? this.repository.findActiveQuestions(serviceId)
        : Promise.resolve([]),
      this.repository.findLatestForAdvisee(serviceId, user.id),
    ]);
    return new ServiceScreeningResponseDto({
      serviceId,
      screeningRequired: service.screeningRequired,
      questions: questions.map(
        (question) => new ScreeningQuestionResponseDto(question),
      ),
      request: request ? new ScreeningRequestResponseDto(request) : null,
    });
  }

  /**
   * Submits answers. Allowed again after a decline or an expiry (decision 5), refused while a
   * request is still pending or already accepted.
   */
  async submit(
    user: SessionUser,
    serviceId: string,
    dto: SubmitScreeningAnswersDto,
  ): Promise<ScreeningRequestResponseDto> {
    const service = await this.repository.findPublishedService(serviceId);
    if (!service) {
      throw new NotFoundException(SCREENING_MESSAGES.serviceNotFound);
    }
    if (!service.screeningRequired) {
      throw new BadRequestException(SCREENING_MESSAGES.notScreened);
    }
    if (service.advisorId === user.id) {
      throw new BadRequestException(SCREENING_MESSAGES.ownService);
    }

    const latest = await this.repository.findLatestForAdvisee(
      serviceId,
      user.id,
    );
    if (latest?.status === 'PENDING') {
      throw new ConflictException(SCREENING_MESSAGES.alreadyPending);
    }
    if (latest?.status === 'ACCEPTED') {
      throw new ConflictException(SCREENING_MESSAGES.alreadyAccepted);
    }

    const questions = await this.repository.findActiveQuestions(serviceId);
    if (questions.length === 0) {
      throw new BadRequestException(SCREENING_MESSAGES.noQuestions);
    }
    const answers = this.matchAnswers(questions, dto);
    const adviseeName =
      (await this.repository.findDisplayName(user.id)) ?? user.name;

    try {
      const request = await this.repository.createWithAnswers(
        { serviceId, adviseeId: user.id },
        answers,
        {
          ownerId: service.advisorId,
          type: 'SCREENING_REQUESTED',
          title: SCREENING_NOTIFICATIONS.requestedTitle,
          content: SCREENING_NOTIFICATIONS.requestedContent(
            adviseeName,
            service.name,
          ),
        },
      );
      return new ScreeningRequestResponseDto(request);
    } catch (error: unknown) {
      // A simultaneous submission lost the race to the pending-request unique index.
      if (isUniqueViolation(error)) {
        throw new ConflictException(SCREENING_MESSAGES.alreadyPending);
      }
      throw error;
    }
  }

  /* ----------------------------------------------------------------- helpers */

  private async getOwnedService(advisorId: string, serviceId: string) {
    const service = await this.repository.findOwnedService(
      serviceId,
      advisorId,
    );
    if (!service) {
      throw new NotFoundException(SCREENING_MESSAGES.serviceNotFound);
    }
    return service;
  }

  private async getAdvisorRequest(
    advisorId: string,
    requestId: string,
  ): Promise<AdvisorScreeningRequestRow> {
    const row = await this.repository.findOneForAdvisor(requestId, advisorId);
    if (!row) {
      throw new NotFoundException(SCREENING_MESSAGES.notFound);
    }
    return row;
  }

  /**
   * One decision, once. Read first so a request nobody owns is a 404 and an already-decided one
   * is a 409; the write itself is still conditional on the request being pending.
   */
  private async decide(
    user: SessionUser,
    requestId: string,
    status: 'ACCEPTED' | 'DECLINED',
    decisionReason: string | null,
  ): Promise<AdvisorScreeningRequestResponseDto> {
    const current = await this.getAdvisorRequest(user.id, requestId);
    if (current.status !== 'PENDING') {
      throw new ConflictException(SCREENING_MESSAGES.alreadyDecided);
    }

    const decided = await this.repository.decidePending(
      requestId,
      { status, decisionReason, decidedAt: new Date() },
      {
        ownerId: current.adviseeId,
        type: 'SCREENING_DECIDED',
        title:
          status === 'ACCEPTED'
            ? SCREENING_NOTIFICATIONS.acceptedTitle
            : SCREENING_NOTIFICATIONS.declinedTitle,
        content: current.serviceName,
      },
    );
    if (!decided) {
      throw new ConflictException(SCREENING_MESSAGES.alreadyDecided);
    }

    return new AdvisorScreeningRequestResponseDto({
      ...current,
      status: decided.status,
      decisionReason: decided.decisionReason,
      decidedAt: decided.decidedAt,
    });
  }

  /**
   * Pairs each answer with its question and snapshots the wording. Every answer must name a
   * current question of this Service, at most once, and every required question needs one.
   */
  private matchAnswers(
    questions: ScreeningQuestion[],
    dto: SubmitScreeningAnswersDto,
  ): ScreeningAnswerInput[] {
    const byId = new Map(questions.map((question) => [question.id, question]));
    const answered = new Set<string>();
    const answers: ScreeningAnswerInput[] = [];

    for (const answer of dto.answers) {
      const question = byId.get(answer.questionId);
      if (!question || answered.has(answer.questionId)) {
        throw new BadRequestException(SCREENING_MESSAGES.invalidAnswers);
      }
      answered.add(answer.questionId);
      answers.push({
        questionId: question.id,
        questionText: question.question,
        answer: answer.answer,
      });
    }

    const missingRequired = questions.some(
      (question) => question.isRequired && !answered.has(question.id),
    );
    if (missingRequired || answers.length === 0) {
      throw new BadRequestException(SCREENING_MESSAGES.invalidAnswers);
    }
    return answers;
  }
}

/** Postgres `unique_violation`, whether Drizzle surfaces it directly or as the cause. */
function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown): unknown =>
    typeof value === 'object' && value !== null && 'code' in value
      ? value.code
      : undefined;
  const cause =
    typeof error === 'object' && error !== null && 'cause' in error
      ? error.cause
      : undefined;
  return code(error) === '23505' || code(cause) === '23505';
}
