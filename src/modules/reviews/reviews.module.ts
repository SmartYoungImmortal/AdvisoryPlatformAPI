import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AdvisorReviewsController } from './advisor-reviews.controller';
import { BookingReviewsController } from './booking-reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BookingReviewsController, AdvisorReviewsController],
  providers: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
