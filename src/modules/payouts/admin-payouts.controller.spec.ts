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

import { AdminPayoutsController } from './admin-payouts.controller';
import { AdminPayoutQueryDto } from './dtos/admin-payout-query.dto';
import type { MarkPayoutPaidDto } from './dtos/mark-payout-paid.dto';
import type { PayoutsService } from './payouts.service';

const payoutId = '55555555-5555-5555-5555-555555555555';

describe('AdminPayoutsController', () => {
  let controller: AdminPayoutsController;
  let service: jest.Mocked<PayoutsService>;

  beforeEach(() => {
    service = {
      findManyForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      markPaid: jest.fn(),
      markFailed: jest.fn(),
    } as unknown as jest.Mocked<PayoutsService>;
    controller = new AdminPayoutsController(service);
  });

  it('delegates the queue list with the status and advisor filters intact', () => {
    const query = Object.assign(new AdminPayoutQueryDto(), {
      status: 'PENDING' as const,
      advisorId: '11111111-1111-1111-1111-111111111111',
    });
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    service.findManyForAdmin.mockReturnValue(result);

    expect(controller.findMany(query)).toBe(result);
    expect(service.findManyForAdmin).toHaveBeenCalledWith(query);
  });

  it('delegates the payout detail read using the route id', () => {
    const result = Promise.resolve({ id: payoutId });
    service.findOneForAdmin.mockReturnValue(
      result as ReturnType<PayoutsService['findOneForAdmin']>,
    );

    expect(controller.findOne(payoutId)).toBe(result);
    expect(service.findOneForAdmin).toHaveBeenCalledWith(payoutId);
  });

  it('delegates mark-paid with the optional provider transfer id', () => {
    const dto = { providerTransferId: 'trsf_test_1' } as MarkPayoutPaidDto;
    const result = Promise.resolve({ id: payoutId });
    service.markPaid.mockReturnValue(
      result as ReturnType<PayoutsService['markPaid']>,
    );

    expect(controller.markPaid(payoutId, dto)).toBe(result);
    expect(service.markPaid).toHaveBeenCalledWith(payoutId, dto);
  });

  it('delegates mark-failed using the route id alone', () => {
    const result = Promise.resolve({ id: payoutId });
    service.markFailed.mockReturnValue(
      result as ReturnType<PayoutsService['markFailed']>,
    );

    expect(controller.markFailed(payoutId)).toBe(result);
    expect(service.markFailed).toHaveBeenCalledWith(payoutId);
  });

  it.each([
    ['findMany', { permission: { payout: ['read'] } }],
    ['findOne', { permission: { payout: ['read'] } }],
    ['markPaid', { permission: { payout: ['decide'] } }],
    ['markFailed', { permission: { payout: ['decide'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      AdminPayoutsController.prototype[method as keyof AdminPayoutsController];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});
