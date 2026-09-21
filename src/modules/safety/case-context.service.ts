import { Injectable, NotFoundException } from '@nestjs/common';
import { CaseContextRepository } from './case-context.repository';
import { OffPlatformFlagsRepository } from './off-platform-flags.repository';
import {
  OFF_PLATFORM_FLAG_MESSAGES,
  REPORT_MESSAGES,
} from './safety.constants';
import { UserReportsRepository } from './user-reports.repository';
import { CaseContextResponseDto } from './dtos/case-context-response.dto';

/**
 * The evidence for a moderation case. Kept apart from `ReportsService` and
 * `OffPlatformFlagsService` because it is read-only and spans both, and because
 * neither ruling needs it — a report can still be resolved on its own row.
 *
 * The conversation and the appointment are read in parallel: each is one round
 * trip to the database, and a moderator is waiting on both.
 */
@Injectable()
export class CaseContextService {
  constructor(
    private readonly reports: UserReportsRepository,
    private readonly flags: OffPlatformFlagsRepository,
    private readonly context: CaseContextRepository,
  ) {}

  async forReport(reportId: string): Promise<CaseContextResponseDto> {
    const report = await this.reports.findById(reportId);
    if (!report) throw new NotFoundException(REPORT_MESSAGES.notFound);
    if (!report.chatRoomId) return new CaseContextResponseDto([], undefined);
    const [conversation, appointment] = await Promise.all([
      this.context.conversation(report.chatRoomId),
      this.context.appointmentForRoom(report.chatRoomId),
    ]);
    return new CaseContextResponseDto(conversation, appointment);
  }

  async forFlag(flagId: string): Promise<CaseContextResponseDto> {
    const flag = await this.flags.findById(flagId);
    if (!flag) throw new NotFoundException(OFF_PLATFORM_FLAG_MESSAGES.notFound);
    const message = await this.context.message(flag.messageId);
    if (!message) {
      return new CaseContextResponseDto([], undefined, flag.messageId);
    }
    const [conversation, appointment] = await Promise.all([
      this.context.conversation(message.chatRoomId),
      this.context.appointmentForRoom(message.chatRoomId),
    ]);
    return new CaseContextResponseDto(
      conversation,
      appointment,
      flag.messageId,
    );
  }
}
