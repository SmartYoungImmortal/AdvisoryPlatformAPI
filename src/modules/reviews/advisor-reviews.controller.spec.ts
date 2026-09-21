import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorReviewsController } from './advisor-reviews.controller';
import type { AdvisorRatingSummaryDto } from './dtos/advisor-rating-summary.dto';
import type { ReviewResponseDto } from './dtos/review-response.dto';
import type { ReviewsService } from './reviews.service';

const advisor = { id: '22222222-2222-2222-2222-222222222222' } as SessionUser;
const advisorId = '22222222-2222-2222-2222-222222222222';
const bookingId = '44444444-4444-4444-4444-444444444444';

describe('AdvisorReviewsController', () => {
  let controller: AdvisorReviewsController;
  let reviews: jest.Mocked<ReviewsService>;

  function stubPage(): Promise<{
    items: ReviewResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  }

  beforeEach(() => {
    reviews = {
      findMineAsAdvisor: jest.fn(),
      reply: jest.fn(),
      findPublicForAdvisor: jest.fn(),
      summaryForAdvisor: jest.fn(),
    } as unknown as jest.Mocked<ReviewsService>;
    controller = new AdvisorReviewsController(reviews);
  });

  it('delegates the advisor’s own paginated list using the session user', () => {
    const query = new OffsetPaginationDto();
    const result = stubPage();
    reviews.findMineAsAdvisor.mockReturnValue(result);

    expect(controller.findMine(advisor, query)).toBe(result);
    expect(reviews.findMineAsAdvisor).toHaveBeenCalledWith(advisor, query);
  });

  it('delegates the reply using the session user', () => {
    const dto = { reply: 'Thank you' };
    const result = Promise.resolve({
      appointmentId: bookingId,
    } as ReviewResponseDto);
    reviews.reply.mockReturnValue(result);

    expect(controller.reply(advisor, bookingId, dto)).toBe(result);
    expect(reviews.reply).toHaveBeenCalledWith(advisor, bookingId, dto);
  });

  it('delegates the public list by advisor id, with no session user', () => {
    const query = new OffsetPaginationDto();
    const result = stubPage();
    reviews.findPublicForAdvisor.mockReturnValue(result);

    expect(controller.findForAdvisor(advisorId, query)).toBe(result);
    expect(reviews.findPublicForAdvisor).toHaveBeenCalledWith(advisorId, query);
  });

  it('delegates the public summary by advisor id', () => {
    const result = Promise.resolve({
      average: 4.9,
      total: 32,
      distribution: [],
    } as AdvisorRatingSummaryDto);
    reviews.summaryForAdvisor.mockReturnValue(result);

    expect(controller.summary(advisorId)).toBe(result);
    expect(reviews.summaryForAdvisor).toHaveBeenCalledWith(advisorId);
  });
});
