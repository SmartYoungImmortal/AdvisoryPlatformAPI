jest.mock('@thallesp/nestjs-better-auth', () => ({
  UserHasPermission:
    (options: unknown) =>
    (_target: object, _key: string, descriptor: PropertyDescriptor) => {
      const handler: unknown = descriptor.value;
      if (typeof handler === 'function') {
        Reflect.defineMetadata('USER_HAS_PERMISSION', options, handler);
      }
    },
}));

import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorBookingsController } from './advisor-bookings.controller';
import type { BookingsService } from './bookings.service';
import type { BookingResponseDto } from './dtos/booking-response.dto';

const advisor = { id: '22222222-2222-2222-2222-222222222222' } as SessionUser;
const bookingId = '44444444-4444-4444-4444-444444444444';

describe('AdvisorBookingsController', () => {
  let controller: AdvisorBookingsController;
  let bookings: jest.Mocked<BookingsService>;

  function stubBooking(): Promise<BookingResponseDto> {
    return Promise.resolve({ id: bookingId } as BookingResponseDto);
  }

  beforeEach(() => {
    bookings = {
      findAdvisorMine: jest.fn(),
      cancelAsAdvisor: jest.fn(),
      start: jest.fn(),
      complete: jest.fn(),
      recordNoShow: jest.fn(),
    } as unknown as jest.Mocked<BookingsService>;
    controller = new AdvisorBookingsController(bookings);
  });

  it('delegates the paginated Advisor booking list using the session user', () => {
    const query = new OffsetPaginationDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    bookings.findAdvisorMine.mockReturnValue(result);

    expect(controller.findMine(advisor, query)).toBe(result);
    expect(bookings.findAdvisorMine).toHaveBeenCalledWith(advisor, query);
  });

  it('cancels as the Advisor party rather than the Advisee party', () => {
    const result = stubBooking();
    bookings.cancelAsAdvisor.mockReturnValue(result);

    expect(controller.cancel(advisor, bookingId)).toBe(result);
    expect(bookings.cancelAsAdvisor).toHaveBeenCalledWith(advisor, bookingId);
  });

  it.each([
    ['start', 'start'],
    ['complete', 'complete'],
    ['recordNoShow', 'recordNoShow'],
  ] as const)('delegates %s to the service', (route, method) => {
    const result = stubBooking();
    bookings[method].mockReturnValue(result);

    expect(controller[route](advisor, bookingId)).toBe(result);
    expect(bookings[method]).toHaveBeenCalledWith(advisor, bookingId);
  });

  it.each(['cancel', 'start', 'complete', 'recordNoShow'] as const)(
    'requires the Advisor updateSelf permission on %s',
    (route) => {
      expect(
        Reflect.getMetadata(
          'USER_HAS_PERMISSION',
          AdvisorBookingsController.prototype[route],
        ),
      ).toEqual({ permission: { advisor: ['updateSelf'] } });
    },
  );
});
