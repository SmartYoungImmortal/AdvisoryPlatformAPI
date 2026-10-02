import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorRatingSummaryDto } from './dtos/advisor-rating-summary.dto';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReplyToReviewDto } from './dtos/reply-to-review.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { REVIEW_MESSAGES } from './reviews.constants';
import { ReviewsRepository } from './reviews.repository';

/** The only appointment state a consultation can be reviewed from. */
const REVIEWABLE_STATE = 'COMPLETED';

@Injectable()
export class ReviewsService {
  constructor(private readonly repository: ReviewsRepository) {}

  /**
   * Writing the Advisee's own review. Two distinct failures reach the client as two distinct
   * codes, because the screens tell them apart: a consultation that has already been reviewed is
   * a 409 the client shows as "already submitted", while a consultation that has not finished is
   * a 409 with its own message, and anything the caller has no claim on is a 404.
   */
  async create(
    user: SessionUser,
    appointmentId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const appointment = await this.repository.findAppointmentForAdvisee(
      appointmentId,
      user.id,
    );
    if (!appointment) throw new NotFoundException(REVIEW_MESSAGES.notFound);
    if (appointment.state !== REVIEWABLE_STATE) {
      throw new ConflictException(REVIEW_MESSAGES.notCompleted);
    }

    const existing = await this.repository.findByAppointmentId(appointmentId);
    if (existing) {
      throw new ConflictException(REVIEW_MESSAGES.alreadyReviewed);
    }

    await this.repository.create({
      appointmentId,
      stars: dto.stars,
      comment: dto.comment ?? null,
    });
    return this.requireDetailed(appointmentId);
  }

  /** The Advisee changing their mind. The Advisor's reply is left where it is. */
  async update(
    user: SessionUser,
    appointmentId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    await this.requireAdviseeReview(user, appointmentId);
    await this.repository.updateRating(appointmentId, {
      stars: dto.stars,
      comment: dto.comment ?? null,
    });
    return this.requireDetailed(appointmentId);
  }

  /** Either participant may read the review of a consultation they took part in. */
  async findOneForParticipant(
    user: SessionUser,
    appointmentId: string,
  ): Promise<ReviewResponseDto> {
    const [asAdvisee, asAdvisor] = await Promise.all([
      this.repository.findAppointmentForAdvisee(appointmentId, user.id),
      this.repository.findAppointmentForAdvisor(appointmentId, user.id),
    ]);
    if (!asAdvisee && !asAdvisor) {
      throw new NotFoundException(REVIEW_MESSAGES.notFound);
    }
    return this.requireDetailed(appointmentId);
  }

  async reply(
    user: SessionUser,
    appointmentId: string,
    dto: ReplyToReviewDto,
  ): Promise<ReviewResponseDto> {
    const appointment = await this.repository.findAppointmentForAdvisor(
      appointmentId,
      user.id,
    );
    if (!appointment) throw new NotFoundException(REVIEW_MESSAGES.notFound);

    const updated = await this.repository.setAdvisorReply(
      appointmentId,
      dto.reply,
    );
    // No review row to reply to reads the same as no appointment: there is nothing here.
    if (!updated) throw new NotFoundException(REVIEW_MESSAGES.notFound);
    return this.requireDetailed(appointmentId);
  }

  findMineAsAdvisor(
    user: SessionUser,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    return this.findForAdvisor(user.id, page);
  }

  async findPublicForAdvisor(
    advisorId: string,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    await this.requirePublicAdvisor(advisorId);
    return this.findForAdvisor(advisorId, page);
  }

  async summaryForAdvisor(advisorId: string): Promise<AdvisorRatingSummaryDto> {
    await this.requirePublicAdvisor(advisorId);
    const countsByStars =
      await this.repository.countByStarsForAdvisor(advisorId);
    return new AdvisorRatingSummaryDto(countsByStars);
  }

  private findForAdvisor(
    advisorId: string,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    return paginateQuery(
      page,
      (options) => this.repository.findManyForAdvisor(advisorId, options),
      () => this.repository.countForAdvisor(advisorId),
      (row) => new ReviewResponseDto(row),
    );
  }

  private async requireAdviseeReview(
    user: SessionUser,
    appointmentId: string,
  ): Promise<void> {
    const appointment = await this.repository.findAppointmentForAdvisee(
      appointmentId,
      user.id,
    );
    if (!appointment) throw new NotFoundException(REVIEW_MESSAGES.notFound);
    const existing = await this.repository.findByAppointmentId(appointmentId);
    if (!existing) throw new NotFoundException(REVIEW_MESSAGES.notFound);
  }

  private async requirePublicAdvisor(advisorId: string): Promise<void> {
    const exists = await this.repository.publicAdvisorExists(advisorId);
    // A suspended or banned advisor is absent, not forbidden — a 403 would confirm the account.
    if (!exists) throw new NotFoundException(REVIEW_MESSAGES.notFound);
  }

  private async requireDetailed(
    appointmentId: string,
  ): Promise<ReviewResponseDto> {
    const row = await this.repository.findDetailed(appointmentId);
    if (!row) throw new NotFoundException(REVIEW_MESSAGES.notFound);
    return new ReviewResponseDto(row);
  }
}
