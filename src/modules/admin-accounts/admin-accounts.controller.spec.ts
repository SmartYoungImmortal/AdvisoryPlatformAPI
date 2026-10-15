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
import { AdminAccountsController } from './admin-accounts.controller';
import type { AdminAccountsService } from './admin-accounts.service';
import { AccountQueryDto } from './dtos/account-query.dto';

const admin = { id: '99999999-9999-9999-9999-999999999999' } as SessionUser;
const userId = '11111111-1111-1111-1111-111111111111';

describe('AdminAccountsController', () => {
  let controller: AdminAccountsController;
  let accounts: jest.Mocked<AdminAccountsService>;

  beforeEach(() => {
    accounts = {
      findMany: jest.fn(),
      findOne: jest.fn(),
      suspend: jest.fn(),
      reinstate: jest.fn(),
    } as unknown as jest.Mocked<AdminAccountsService>;
    controller = new AdminAccountsController(accounts);
  });

  it('delegates the account list with its filters', () => {
    const query = new AccountQueryDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    accounts.findMany.mockReturnValue(result);

    expect(controller.findMany(query)).toBe(result);
    expect(accounts.findMany).toHaveBeenCalledWith(query);
  });

  it('delegates one account read using the route id', () => {
    const result = Promise.resolve({ id: userId });
    accounts.findOne.mockReturnValue(
      result as ReturnType<AdminAccountsService['findOne']>,
    );

    expect(controller.findOne(userId)).toBe(result);
    expect(accounts.findOne).toHaveBeenCalledWith(userId);
  });

  it('delegates a suspension using the session admin, so self-suspension can be caught', () => {
    const dto = { reason: 'Off-platform solicitation' };
    const result = Promise.resolve({ id: userId });
    accounts.suspend.mockReturnValue(
      result as ReturnType<AdminAccountsService['suspend']>,
    );

    expect(controller.suspend(admin, userId, dto)).toBe(result);
    expect(accounts.suspend).toHaveBeenCalledWith(admin, userId, dto);
  });

  it('delegates a reinstatement using the route id', () => {
    const result = Promise.resolve({ id: userId });
    accounts.reinstate.mockReturnValue(
      result as ReturnType<AdminAccountsService['reinstate']>,
    );

    expect(controller.reinstate(userId)).toBe(result);
    expect(accounts.reinstate).toHaveBeenCalledWith(userId);
  });

  /**
   * The permissions are better-auth's own admin-plugin `user` statements, not a resource
   * invented for this module — `adminAc.statements` already grants `list`, `get` and `ban`.
   */
  it.each([
    ['findMany', { permission: { user: ['list'] } }],
    ['findOne', { permission: { user: ['get'] } }],
    ['suspend', { permission: { user: ['ban'] } }],
    ['reinstate', { permission: { user: ['ban'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      AdminAccountsController.prototype[
        method as keyof AdminAccountsController
      ];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});
