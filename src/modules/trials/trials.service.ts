import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '@/common/utils/unique-violation';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ChatGateway } from '@/modules/chat/chat.gateway';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import type { NotifyInput } from '@/modules/notifications/notifications.types';
import { DeclineTrialRequestDto } from './dtos/decline-trial-request.dto';
import { ServiceTrialResponseDto } from './dtos/service-trial-response.dto';
import { TrialRequestResponseDto } from './dtos/trial-request-response.dto';
import { TRIAL_MESSAGES, TRIAL_NOTIFICATIONS } from './trials.constants';
import { TrialsRepository } from './trials.repository';
import type { TrialRequestRow } from './trials.types';

@Injectable()
export class TrialsService {
  private readonly logger = new Logger(TrialsService.name);

  constructor(
    private readonly repository: TrialsRepository,
    private readonly notifications: NotificationsService,
    private readonly chat: ChatGateway,
  ) {}

  /* ----------------------------------------------------------------- advisee */

  /** Whether the Service offers a free trial, and the caller's request for it if they sent one. */
  async findForService(
    user: SessionUser,
    serviceId: string,
  ): Promise<ServiceTrialResponseDto> {
    const service = await this.repository.findPublishedService(serviceId);
    if (!service) throw new NotFoundException(TRIAL_MESSAGES.serviceNotFound);
    const request = await this.repository.findForAdvisee(serviceId, user.id);
    return new ServiceTrialResponseDto({
      serviceId,
      trialEnabled: service.trialEnabled,
      trialDurationMinutes: service.trialDurationMinutes,
      request: request ? new TrialRequestResponseDto(request) : null,
    });
  }

  /**
   * Asks for the Service's free trial. The request opens the chat room with the Advisor (or joins
   * the one they have for this Service), where its card is. One ask per Service, whatever the
   * answer: after a decline the Advisee can still book a paid session.
   */
  async request(
    user: SessionUser,
    serviceId: string,
  ): Promise<TrialRequestResponseDto> {
    const service = await this.repository.findPublishedService(serviceId);
    if (!service) throw new NotFoundException(TRIAL_MESSAGES.serviceNotFound);
    if (!service.trialEnabled || service.trialDurationMinutes === null) {
      throw new BadRequestException(TRIAL_MESSAGES.noTrial);
    }
    if (service.advisorId === user.id) {
      throw new BadRequestException(TRIAL_MESSAGES.ownService);
    }
    if (await this.repository.findForAdvisee(serviceId, user.id)) {
      throw new ConflictException(TRIAL_MESSAGES.alreadyRequested);
    }

    let request;
    try {
      request = await this.repository.createWithRoom({
        serviceId,
        adviseeId: user.id,
        advisorId: service.advisorId,
      });
    } catch (error: unknown) {
      // Another ask for the same Service was saved at the same moment.
      if (isUniqueViolation(error)) {
        throw new ConflictException(TRIAL_MESSAGES.alreadyRequested);
      }
      throw error;
    }

    const row: TrialRequestRow = {
      ...request,
      serviceName: service.name,
      advisorId: service.advisorId,
      trialDurationMinutes: service.trialDurationMinutes,
      trialBookingId: null,
    };
    await this.notifyRequested(row, user);
    return this.announce(row);
  }

  /* --------------------------------------------------------------- chat room */

  /** The request cards of a chat room, for either of its members. */
  async findForRoom(
    user: SessionUser,
    chatRoomId: string,
  ): Promise<TrialRequestResponseDto[]> {
    if (!(await this.repository.isRoomMember(chatRoomId, user.id))) {
      throw new NotFoundException(TRIAL_MESSAGES.roomNotFound);
    }
    const rows = await this.repository.findForRoom(chatRoomId);
    return rows.map((row) => new TrialRequestResponseDto(row));
  }

  /* ----------------------------------------------------------------- advisor */

  grant(
    user: SessionUser,
    requestId: string,
  ): Promise<TrialRequestResponseDto> {
    return this.decide(user, requestId, 'GRANTED', null);
  }

  decline(
    user: SessionUser,
    requestId: string,
    dto: DeclineTrialRequestDto,
  ): Promise<TrialRequestResponseDto> {
    return this.decide(user, requestId, 'DECLINED', dto.message || null);
  }

  /* ----------------------------------------------------------------- helpers */

  /**
   * Grants or declines a request of one of the Advisor's Services. It is read first for a 404
   * (not theirs) or a 409 (already decided); the update checks again that it is still pending.
   * A Service that stopped offering a trial can still decline its requests, but not grant them.
   */
  private async decide(
    user: SessionUser,
    requestId: string,
    status: 'GRANTED' | 'DECLINED',
    decisionReason: string | null,
  ): Promise<TrialRequestResponseDto> {
    const current = await this.repository.findOneForAdvisor(requestId, user.id);
    if (!current) throw new NotFoundException(TRIAL_MESSAGES.notFound);
    if (current.status !== 'PENDING') {
      throw new ConflictException(TRIAL_MESSAGES.alreadyDecided);
    }
    if (status === 'GRANTED' && current.trialDurationMinutes === null) {
      throw new BadRequestException(TRIAL_MESSAGES.noTrial);
    }

    const decided = await this.repository.decidePending(requestId, {
      status,
      decisionReason,
      decidedAt: new Date(),
    });
    if (!decided) throw new ConflictException(TRIAL_MESSAGES.alreadyDecided);

    const row: TrialRequestRow = { ...current, ...decided };
    await this.notifyDecided(row, user);
    return this.announce(row);
  }

  /** Shows the card's new state in the open room. A socket that fails must not undo the write. */
  private announce(row: TrialRequestRow): TrialRequestResponseDto {
    const dto = new TrialRequestResponseDto(row);
    try {
      this.chat.announceTrial(dto);
    } catch (error: unknown) {
      this.logger.warn(
        `Could not announce trial request ${row.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
    return dto;
  }

  /** Tells the Advisor. Only the request that saved the ask gets here, so it is sent once. */
  private async notifyRequested(
    row: TrialRequestRow,
    advisee: SessionUser,
  ): Promise<void> {
    const minutes = row.trialDurationMinutes ?? 0;
    await this.send(async () => {
      const [adviseeName, names] = await Promise.all([
        this.adviseeName(advisee),
        this.repository.findServiceNames(row.serviceId),
      ]);
      return {
        ownerId: row.advisorId,
        type: 'TRIAL_REQUESTED',
        title: TRIAL_NOTIFICATIONS.requestedTitle,
        content: TRIAL_NOTIFICATIONS.requestedContent(
          adviseeName,
          minutes,
          names?.th ?? row.serviceName,
        ),
        en: {
          title: TRIAL_NOTIFICATIONS.en.requestedTitle,
          content: TRIAL_NOTIFICATIONS.en.requestedContent(
            adviseeName,
            minutes,
            names?.en ?? row.serviceName,
          ),
        },
        resourceId: row.chatRoomId,
      };
    }, row.id);
  }

  /** Tells the Advisee. Only the decision that won the guarded update gets here. */
  private async notifyDecided(
    row: TrialRequestRow,
    advisor: SessionUser,
  ): Promise<void> {
    await this.send(async () => {
      if (row.status === 'GRANTED') {
        const advisorName =
          (await this.repository.findDisplayName(advisor.id)) ?? advisor.name;
        return {
          ownerId: row.adviseeId,
          type: 'TRIAL_DECIDED',
          title: TRIAL_NOTIFICATIONS.grantedTitle,
          content: TRIAL_NOTIFICATIONS.grantedContent(advisorName),
          en: {
            title: TRIAL_NOTIFICATIONS.en.grantedTitle,
            content: TRIAL_NOTIFICATIONS.en.grantedContent(advisorName),
          },
          resourceId: row.chatRoomId,
        };
      }
      // The Service's name in each language, not `row`'s, which is in the Advisor's.
      const names = await this.repository.findServiceNames(row.serviceId);
      return {
        ownerId: row.adviseeId,
        type: 'TRIAL_DECIDED',
        title: TRIAL_NOTIFICATIONS.declinedTitle,
        content: names?.th ?? row.serviceName,
        en: {
          title: TRIAL_NOTIFICATIONS.en.declinedTitle,
          content: names?.en ?? row.serviceName,
        },
        resourceId: row.chatRoomId,
      };
    }, row.id);
  }

  /** A notification that fails must not undo the request or the decision already saved. */
  private async send(
    build: () => Promise<NotifyInput>,
    requestId: string,
  ): Promise<void> {
    try {
      await this.notifications.notify(await build());
    } catch (error: unknown) {
      this.logger.warn(
        `Could not notify trial request ${requestId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async adviseeName(advisee: SessionUser): Promise<string> {
    return (await this.repository.findDisplayName(advisee.id)) ?? advisee.name;
  }
}
