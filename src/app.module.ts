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

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
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
    // Last, so the literal `advisors/me/...` controllers register before this module's
    // `advisors/:advisorId/reviews` and a request for `me` is never captured by the parameter.
    ReviewsModule,
  ],
})
export class AppModule {}
