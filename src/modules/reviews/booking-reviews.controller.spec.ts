import type { SessionUser } from '@/modules/auth/auth.config';
import { BookingReviewsController } from './booking-reviews.controller';
import type { ReviewResponseDto } from './dtos/review-response.dto';
import type { ReviewsService } from './reviews.service';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const bookingId = '44444444-4444-4444-4444-444444444444';

describe('BookingReviewsController', () => {
  let controller: BookingReviewsController;
  let reviews: jest.Mocked<ReviewsService>;

  function stubReview(): Promise<ReviewResponseDto> {
    return Promise.resolve({ appointmentId: bookingId } as ReviewResponseDto);
  }

  beforeEach(() => {
    reviews = {
      create: jest.fn(),
      update: jest.fn(),
      findOneForParticipant: jest.fn(),
    } as unknown as jest.Mocked<ReviewsService>;
    controller = new BookingReviewsController(reviews);
  });

  it('delegates the read using the session user', () => {
    const result = stubReview();
    reviews.findOneForParticipant.mockReturnValue(result);

    expect(controller.findOne(user, bookingId)).toBe(result);
    expect(reviews.findOneForParticipant).toHaveBeenCalledWith(user, bookingId);
  });

  it('delegates creation using the session user', () => {
    const dto = { stars: 5, comment: 'Clear and useful' };
    const result = stubReview();
    reviews.create.mockReturnValue(result);

    expect(controller.create(user, bookingId, dto)).toBe(result);
    expect(reviews.create).toHaveBeenCalledWith(user, bookingId, dto);
  });

  it('delegates the rewrite using the session user', () => {
    const dto = { stars: 3 };
    const result = stubReview();
    reviews.update.mockReturnValue(result);

    expect(controller.update(user, bookingId, dto)).toBe(result);
    expect(reviews.update).toHaveBeenCalledWith(user, bookingId, dto);
  });
});
