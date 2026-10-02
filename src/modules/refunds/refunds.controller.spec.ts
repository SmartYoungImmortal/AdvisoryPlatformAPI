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
import { RefundsController } from './refunds.controller';
import type { RefundsService } from './refunds.service';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const refundCaseId = '44444444-4444-4444-4444-444444444444';

describe('RefundsController', () => {
  let controller: RefundsController;
  let service: jest.Mocked<RefundsService>;

  beforeEach(() => {
    service = {
      open: jest.fn(),
      findMine: jest.fn(),
    } as unknown as jest.Mocked<RefundsService>;
    controller = new RefundsController(service);
  });

  it('delegates opening a case using the session user', () => {
    const dto = {
      invoiceId: '33333333-3333-3333-3333-333333333333',
      reason: 'The consultation never happened',
    };
    const result = Promise.resolve({ id: refundCaseId });
    service.open.mockReturnValue(result as ReturnType<RefundsService['open']>);

    expect(controller.open(user, dto)).toBe(result);
    expect(service.open).toHaveBeenCalledWith(user, dto);
  });

  it('delegates the own-case list using the session user', () => {
    const query = new OffsetPaginationDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    service.findMine.mockReturnValue(result);

    expect(controller.findMine(user, query)).toBe(result);
    expect(service.findMine).toHaveBeenCalledWith(user, query);
  });

  it.each([
    ['open', { permission: { refund: ['submitSelf'] } }],
    ['findMine', { permission: { refund: ['readSelf'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      RefundsController.prototype[method as keyof RefundsController];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});
