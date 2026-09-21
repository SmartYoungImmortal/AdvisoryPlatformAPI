import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiConflictResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiGetOne,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { REVIEW_MESSAGES } from './reviews.constants';
import { ReviewsService } from './reviews.service';

/**
 * A review hangs off the consultation it is about, so it is addressed as that booking's
 * subresource rather than given an id of its own — the appointment's id *is* the review's.
 */
@ApiTags('Reviews')
@Controller('bookings/:bookingId/review')
export class BookingReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiGetOne(ReviewResponseDto, { name: 'Review' })
  findOne(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<ReviewResponseDto> {
    return this.reviews.findOneForParticipant(user, bookingId);
  }

  @Post()
  @ResponseMessage(REVIEW_MESSAGES.created)
  @ApiCreate(ReviewResponseDto, { name: 'Review' })
  @ApiConflictResponse({
    description: `${REVIEW_MESSAGES.alreadyReviewed}; ${REVIEW_MESSAGES.notCompleted}`,
  })
  create(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviews.create(user, bookingId, dto);
  }

  @Put()
  @ResponseMessage(REVIEW_MESSAGES.updated)
  @ApiUpdate(ReviewResponseDto, { name: 'Review' })
  update(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviews.update(user, bookingId, dto);
  }
}
