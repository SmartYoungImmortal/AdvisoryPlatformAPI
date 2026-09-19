import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { REPORT_OUTCOMES, type ReportOutcome } from '../safety.constants';

/**
 * The ruling on a report: `ACTIONED` when the admin acted on it, `DISMISSED` when they did
 * not. `OPEN` is not an outcome, so it is not accepted — a ruling only ever moves a report
 * into a terminal state.
 *
 * There is no `note` field, and that is not an oversight: `user_reports` has no column to
 * put one in (id, reporter, reported, chat room, reason, status, reviewed_by_admin_id,
 * created_at, resolved_at) and no audit-log table exists in `src/database/schema`. Accepting
 * a note here would take text from an admin and drop it on the floor, so the request is
 * rejected instead until a `resolution_note` column (or an audit log) exists to hold it.
 */
export class ResolveReportDto {
  @ApiProperty({ enum: REPORT_OUTCOMES })
  @IsIn(REPORT_OUTCOMES)
  outcome!: ReportOutcome;
}
