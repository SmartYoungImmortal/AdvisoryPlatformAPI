import { Module } from '@nestjs/common';
import { AdvisorsController } from './advisors.controller';
import { PublicAdvisorsController } from './public-advisors.controller';
import { AdvisorsService } from './advisors.service';
import { AdvisorsRepository } from './advisors.repository';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  // Order is load-bearing. `AdvisorsController` holds the literal `me` routes and
  // `PublicAdvisorsController` holds `:advisorId`, so the literal must register
  // first or `GET /advisors/me` resolves as an advisor whose id is "me" and fails
  // the UUID pipe. `app.module.ts` applies the same rule to `ReviewsModule`.
  controllers: [AdvisorsController, PublicAdvisorsController],
  providers: [AdvisorsService, AdvisorsRepository],
})
export class AdvisorsModule {}
