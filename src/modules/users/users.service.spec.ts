import { NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import { Role } from '../../common/decorators/roles.decorator';
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
    Pick<UsersRepository, 'findById' | 'findRoleMembership' | 'updateById'>
  >;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findRoleMembership: jest.fn(),
      updateById: jest.fn(),
    };
    service = new UsersService(repository as unknown as UsersRepository);
  });

  it('returns an allowlisted own profile with additive roles', async () => {
    repository.findById.mockResolvedValue(profile());
    repository.findRoleMembership.mockResolvedValue({
      isAdvisor: true,
      isAdmin: true,
    });

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
    repository.findRoleMembership.mockResolvedValue({
      isAdvisor: false,
      isAdmin: false,
    });

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
    repository.findRoleMembership.mockResolvedValue({
      isAdvisor: false,
      isAdmin: false,
    });

    await expect(service.getMe(userId)).rejects.toThrow(NotFoundException);
  });

  it('throws when the user profile cannot be updated', async () => {
    repository.updateById.mockResolvedValue(undefined);

    await expect(
      service.updateMe(userId, { displayName: 'Missing' }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.findRoleMembership).not.toHaveBeenCalled();
  });
});
