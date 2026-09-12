import type { SessionUser } from '@/modules/auth/auth.config';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { BookingsController } from './bookings.controller';
import type { BookingsService } from './bookings.service';
import type { BookingResponseDto } from './dtos/booking-response.dto';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const bookingId = '44444444-4444-4444-4444-444444444444';
const serviceId = '33333333-3333-3333-3333-333333333333';
const startTime = '2026-09-20T03:00:00.000Z';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookings: jest.Mocked<BookingsService>;

  function stubBooking(): Promise<BookingResponseDto> {
    return Promise.resolve({ id: bookingId } as BookingResponseDto);
  }

  beforeEach(() => {
    bookings = {
      create: jest.fn(),
      findMine: jest.fn(),
      findOne: jest.fn(),
      cancelAsAdvisee: jest.fn(),
      reschedule: jest.fn(),
    } as unknown as jest.Mocked<BookingsService>;
    controller = new BookingsController(bookings);
  });

  it('delegates creation using the session user', () => {
    const dto = { serviceId, startTime };
    const result = stubBooking();
    bookings.create.mockReturnValue(result);

    expect(controller.create(user, dto)).toBe(result);
    expect(bookings.create).toHaveBeenCalledWith(user, dto);
  });

  it('delegates the paginated own-booking list using the session user', () => {
    const query = new OffsetPaginationDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    bookings.findMine.mockReturnValue(result);

    expect(controller.findMine(user, query)).toBe(result);
    expect(bookings.findMine).toHaveBeenCalledWith(user, query);
  });

  it('delegates a booking read using the session user and route id', () => {
    const result = stubBooking();
    bookings.findOne.mockReturnValue(result);

    expect(controller.findOne(user, bookingId)).toBe(result);
    expect(bookings.findOne).toHaveBeenCalledWith(user, bookingId);
  });

  it('cancels as the Advisee party rather than the Advisor party', () => {
    const result = stubBooking();
    bookings.cancelAsAdvisee.mockReturnValue(result);

    expect(controller.cancel(user, bookingId)).toBe(result);
    expect(bookings.cancelAsAdvisee).toHaveBeenCalledWith(user, bookingId);
  });

  it('delegates a reschedule using the session user, route id, and new time', () => {
    const dto = { startTime };
    const result = stubBooking();
    bookings.reschedule.mockReturnValue(result);

    expect(controller.reschedule(user, bookingId, dto)).toBe(result);
    expect(bookings.reschedule).toHaveBeenCalledWith(user, bookingId, dto);
  });
});
