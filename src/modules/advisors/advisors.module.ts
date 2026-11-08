import { Module } from '@nestjs/common';
import { AdvisorsController } from './advisors.controller';
import { AdvisorPortfolioController } from './advisor-portfolio.controller';
import { PublicAdvisorsController } from './public-advisors.controller';
import { AdvisorsService } from './advisors.service';
import { AdvisorsRepository } from './advisors.repository';
import { AdvisorBackgroundRepository } from './advisor-background.repository';
import { AdvisorBackgroundService } from './advisor-background.service';
import { AdvisorPortfolioRepository } from './advisor-portfolio.repository';
import { AdvisorPortfolioService } from './advisor-portfolio.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { StorageModule } from '@/common/storage/storage.module';

@Module({
  imports: [AuthModule, StorageModule],
  // Order is load-bearing. `AdvisorsController` and `AdvisorPortfolioController` hold the
  // literal `me` routes and `PublicAdvisorsController` holds `:advisorId`, so the literals
  // must register first or `GET /advisors/me` resolves as an advisor whose id is "me" and
  // fails the UUID pipe. `app.module.ts` applies the same rule to `ReviewsModule`.
  controllers: [
    AdvisorsController,
    AdvisorPortfolioController,
    PublicAdvisorsController,
  ],
  providers: [
    AdvisorsService,
    AdvisorsRepository,
    AdvisorBackgroundService,
    AdvisorBackgroundRepository,
    AdvisorPortfolioService,
    AdvisorPortfolioRepository,
  ],
})
export class AdvisorsModule {}
