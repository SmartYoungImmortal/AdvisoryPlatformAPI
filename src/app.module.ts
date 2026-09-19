import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AdvisorsModule } from './modules/advisors/advisors.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { AdvisorServicesModule } from './modules/advisor-services/advisor-services.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityVerificationModule } from './modules/identity-verification/identity-verification.module';
import { SkillProofsModule } from './modules/skill-proofs/skill-proofs.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { SafetyModule } from './modules/safety/safety.module';
import { AdminAccountsModule } from './modules/admin-accounts/admin-accounts.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    AdvisorsModule,
    SkillsModule,
    ServiceCategoriesModule,
    UsersModule,
    ChatModule,
    AdvisorServicesModule,
    PaymentModule,
    AvailabilityModule,
    BookingsModule,
    // The moderation queues. Each one owns an `admin/<queue>` prefix plus, where an
    // Advisor or Advisee can see their own row, an `advisors/me/...` or a `…/me`
    // route — so all of them must register ahead of `ReviewsModule` for the reason
    // its own comment gives.
    IdentityVerificationModule,
    SkillProofsModule,
    RefundsModule,
    PayoutsModule,
    SafetyModule,
    AdminAccountsModule,
    // Last, so the literal `advisors/me/...` controllers register before this module's
    // `advisors/:advisorId/reviews` and a request for `me` is never captured by the parameter.
    ReviewsModule,
  ],
})
export class AppModule {}
