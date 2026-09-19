import { Module } from '@nestjs/common';
import { AdminIdentityVerificationsController } from './admin-identity-verifications.controller';
import { AdvisorIdentityVerificationController } from './advisor-identity-verification.controller';
import { IdentityVerificationRepository } from './identity-verification.repository';
import { IdentityVerificationService } from './identity-verification.service';

@Module({
  // The literal `advisors/me/...` controller is listed first, matching the rule
  // `AdvisorsModule` and `app.module.ts` already apply: nothing here collides with
  // `advisors/:advisorId` at three segments, but the ordering costs nothing and keeps
  // one habit for every `me` route.
  controllers: [
    AdvisorIdentityVerificationController,
    AdminIdentityVerificationsController,
  ],
  providers: [IdentityVerificationService, IdentityVerificationRepository],
})
export class IdentityVerificationModule {}
