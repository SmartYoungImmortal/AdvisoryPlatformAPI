import { Module } from '@nestjs/common';
import { AdminCaseContextController } from './admin-case-context.controller';
import { AdminOffPlatformFlagsController } from './admin-off-platform-flags.controller';
import { AdminProfilesRepository } from './admin-profiles.repository';
import { AdminReportsController } from './admin-reports.controller';
import { CaseContextRepository } from './case-context.repository';
import { CaseContextService } from './case-context.service';
import { OffPlatformFlagsRepository } from './off-platform-flags.repository';
import { OffPlatformFlagsService } from './off-platform-flags.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { UserReportsRepository } from './user-reports.repository';

/**
 * The two moderation surfaces that protect people rather than money: reports one user files
 * about another, and the messages an off-platform-contact detector flagged.
 *
 * `ReportsController` is listed before `AdminReportsController` only for readability — the
 * paths (`reports` and `admin/reports`) do not overlap, so registration order is not
 * load-bearing the way it is for `ReviewsModule` in app.module.ts.
 */
@Module({
  controllers: [
    ReportsController,
    AdminReportsController,
    AdminOffPlatformFlagsController,
    AdminCaseContextController,
  ],
  providers: [
    ReportsService,
    OffPlatformFlagsService,
    CaseContextService,
    UserReportsRepository,
    OffPlatformFlagsRepository,
    CaseContextRepository,
    AdminProfilesRepository,
  ],
})
export class SafetyModule {}
