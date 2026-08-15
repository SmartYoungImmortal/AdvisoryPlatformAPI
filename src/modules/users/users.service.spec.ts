import { NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import { Role } from '../../common/decorators/roles.decorator';
import type { RoleResolver } from '../../common/authorization/role-resolver.service';
import type { user } from '../../database/schema';
import type { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

type User = InferSelectModel<typeof user>;

const userId = '11111111-1111-4111-8111-111111111111';

function profile(): User {
  return {
    id: userId,
    email: 'person@example.test',
    emailVerified: false,
    displayName: 'Person',
    image: null,
    fullName: 'Example Person',
    avatarKey: null,
    timezone: 'Asia/Bangkok',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

describe('UsersService', () => {
  let repository: jest.Mocked<
    Pick<
      UsersRepository,
      'findById' | 'updateById' | 'removeAvatar' | 'anonymizeById'
    >
  >;
  let roleResolver: jest.Mocked<Pick<RoleResolver, 'resolve'>>;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      updateById: jest.fn(),
      removeAvatar: jest.fn(),
      anonymizeById: jest.fn(),
    };
    roleResolver = { resolve: jest.fn() };
    service = new UsersService(
      repository as unknown as UsersRepository,
      roleResolver as unknown as RoleResolver,
    );
  });

  it('returns an allowlisted own profile with additive roles', async () => {
    repository.findById.mockResolvedValue(profile());
    roleResolver.resolve.mockResolvedValue([
      Role.Advisee,
      Role.Advisor,
      Role.Admin,
    ]);

    const result = await service.getMe(userId);

    expect(result).toEqual(
      expect.objectContaining({
        id: userId,
        displayName: 'Person',
        email: 'person@example.test',
        roles: [Role.Advisee, Role.Advisor, Role.Admin],
      }),
    );
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('image');
  });

  it('updates only fields accepted by the update DTO', async () => {
    repository.updateById.mockResolvedValue({
      ...profile(),
      displayName: 'Updated',
    });
    roleResolver.resolve.mockResolvedValue([Role.Advisee]);

    const result = await service.updateMe(userId, { displayName: 'Updated' });

    expect(repository.updateById).toHaveBeenCalledTimes(1);
    const [updatedUserId, values] = repository.updateById.mock.calls[0];
    expect(updatedUserId).toBe(userId);
    expect(values.displayName).toBe('Updated');
    expect(values.updatedAt).toBeInstanceOf(Date);
    expect(result.displayName).toBe('Updated');
    expect(result.roles).toEqual([Role.Advisee]);
  });

  it('throws when the user profile cannot be found', async () => {
    repository.findById.mockResolvedValue(undefined);
    roleResolver.resolve.mockResolvedValue([Role.Advisee]);

    await expect(service.getMe(userId)).rejects.toThrow(NotFoundException);
  });

  it('throws when the user profile cannot be updated', async () => {
    repository.updateById.mockResolvedValue(undefined);

    await expect(
      service.updateMe(userId, { displayName: 'Missing' }),
    ).rejects.toThrow(NotFoundException);
    expect(roleResolver.resolve).not.toHaveBeenCalled();
  });

  it('removes the current user avatar', async () => {
    repository.removeAvatar.mockResolvedValue({
      avatarKey: `avatars/${userId}.webp`,
    });

    await expect(service.removeAvatar(userId)).resolves.toEqual({
      avatarKey: `avatars/${userId}.webp`,
    });
    expect(repository.removeAvatar).toHaveBeenCalledWith(userId);
  });

  it('throws when removing an avatar for a missing user', async () => {
    repository.removeAvatar.mockResolvedValue(undefined);

    await expect(service.removeAvatar(userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('anonymizes and deletes the current account', async () => {
    repository.anonymizeById.mockResolvedValue(profile());
    roleResolver.resolve.mockResolvedValue([Role.Advisee, Role.Advisor]);

    await expect(service.deleteMe(userId)).resolves.toEqual(
      expect.objectContaining({
        id: userId,
        email: 'person@example.test',
        roles: [Role.Advisee, Role.Advisor],
      }),
    );
    expect(repository.anonymizeById).toHaveBeenCalledWith(userId);
  });

  it('throws when deleting a missing account', async () => {
    repository.anonymizeById.mockResolvedValue(undefined);
    roleResolver.resolve.mockResolvedValue([Role.Advisee]);

    await expect(service.deleteMe(userId)).rejects.toThrow(NotFoundException);
  });
});
