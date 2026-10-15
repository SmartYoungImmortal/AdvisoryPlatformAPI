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
import { AdvisorPayoutsController } from './advisor-payouts.controller';
import type { PayoutsService } from './payouts.service';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;

describe('AdvisorPayoutsController', () => {
  let controller: AdvisorPayoutsController;
  let service: jest.Mocked<PayoutsService>;

  beforeEach(() => {
    service = {
      findMine: jest.fn(),
    } as unknown as jest.Mocked<PayoutsService>;
    controller = new AdvisorPayoutsController(service);
  });

  it('reads the advisor from the session rather than from the request', () => {
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

  it('declares the required permission for findMine', () => {
    expect(
      Reflect.getMetadata(
        'USER_HAS_PERMISSION',
        AdvisorPayoutsController.prototype.findMine,
      ),
    ).toEqual({ permission: { payout: ['readSelf'] } });
  });
});
