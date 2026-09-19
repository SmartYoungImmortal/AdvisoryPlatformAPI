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

import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminRefundsController } from './admin-refunds.controller';
import { AdminRefundCaseQueryDto } from './dtos/admin-refund-case-query.dto';
import type { RefundsService } from './refunds.service';

const admin = { id: '22222222-2222-2222-2222-222222222222' } as SessionUser;
const refundCaseId = '44444444-4444-4444-4444-444444444444';

describe('AdminRefundsController', () => {
  let controller: AdminRefundsController;
  let service: jest.Mocked<RefundsService>;

  beforeEach(() => {
    service = {
      findManyForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    } as unknown as jest.Mocked<RefundsService>;
    controller = new AdminRefundsController(service);
  });

  it('delegates the queue list with the status filter intact', () => {
    const query = Object.assign(new AdminRefundCaseQueryDto(), {
      status: 'OPEN' as const,
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

  it('delegates the case detail read using the route id', () => {
    const result = Promise.resolve({ id: refundCaseId });
    service.findOneForAdmin.mockReturnValue(
      result as ReturnType<RefundsService['findOneForAdmin']>,
    );

    expect(controller.findOne(refundCaseId)).toBe(result);
    expect(service.findOneForAdmin).toHaveBeenCalledWith(refundCaseId);
  });

  it('delegates approval using the session Admin and the route id', () => {
    const result = Promise.resolve({ id: refundCaseId });
    service.approve.mockReturnValue(
      result as ReturnType<RefundsService['approve']>,
    );

    expect(controller.approve(admin, refundCaseId)).toBe(result);
    expect(service.approve).toHaveBeenCalledWith(admin, refundCaseId);
  });

  it('delegates rejection with its required reason', () => {
    const dto = { reason: 'Outside policy' };
    const result = Promise.resolve({ id: refundCaseId });
    service.reject.mockReturnValue(
      result as ReturnType<RefundsService['reject']>,
    );

    expect(controller.reject(admin, refundCaseId, dto)).toBe(result);
    expect(service.reject).toHaveBeenCalledWith(admin, refundCaseId, dto);
  });

  it.each([
    ['findMany', { permission: { refund: ['read'] } }],
    ['findOne', { permission: { refund: ['read'] } }],
    ['approve', { permission: { refund: ['decide'] } }],
    ['reject', { permission: { refund: ['decide'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      AdminRefundsController.prototype[method as keyof AdminRefundsController];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});
