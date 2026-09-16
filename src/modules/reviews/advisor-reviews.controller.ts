import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorRatingSummaryDto } from './dtos/advisor-rating-summary.dto';
import { ReplyToReviewDto } from './dtos/reply-to-review.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { REVIEW_MESSAGES } from './reviews.constants';
import { ReviewsService } from './reviews.service';

/**
 * The `me` routes are declared before `:advisorId`, and both live in this one controller so that
 * ordering is a property of the file rather than of module registration order — otherwise
 * `/advisors/me/reviews` can be captured by `:advisorId` and rejected by its UUID pipe.
 */
@ApiTags('Reviews')
@Controller('advisors')
export class AdvisorReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('me/reviews')
  @ApiGetPaginated(ReviewResponseDto, { name: 'Review' })
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    return this.reviews.findMineAsAdvisor(user, query);
  }

  @Patch('me/reviews/:bookingId/reply')
  @ResponseMessage(REVIEW_MESSAGES.replied)
  @ApiUpdate(ReviewResponseDto, { name: 'Review' })
  reply(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: ReplyToReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviews.reply(user, bookingId, dto);
  }

  @Public()
  @Get(':advisorId/reviews')
  @ApiGetPaginated(ReviewResponseDto, { name: 'Review', public: true })
  findForAdvisor(
    @Param('advisorId', ParseUUIDPipe) advisorId: string,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    return this.reviews.findPublicForAdvisor(advisorId, query);
  }

  /**
   * The score and the five bars above the list. Public, and the Advisor's own screen reads it
   * with their own id rather than through a second private route — the numbers are the same
   * either way, and one route cannot drift from the other.
   */
  @Public()
  @Get(':advisorId/reviews/summary')
  @ApiGetOne(AdvisorRatingSummaryDto, {
    name: 'Advisor rating summary',
    public: true,
  })
  summary(
    @Param('advisorId', ParseUUIDPipe) advisorId: string,
  ): Promise<AdvisorRatingSummaryDto> {
    return this.reviews.summaryForAdvisor(advisorId);
  }
}
