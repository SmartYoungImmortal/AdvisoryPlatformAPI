import {
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import { Role } from '@/common/authorization/role.enum';
import type { RoleResolver } from '@/common/authorization/role-resolver.service';
import type { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import type { user } from '@/database/schema';
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
      | 'findById'
      | 'updateById'
      | 'removeAvatar'
      | 'replaceAvatar'
      | 'anonymizeById'
    >
  >;
  let roleResolver: jest.Mocked<Pick<RoleResolver, 'resolve'>>;
  let storage: jest.Mocked<
    Pick<
      SeaweedFsStorageService,
      'putObject' | 'removeObject' | 'createDownloadUrl'
    >
  >;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      updateById: jest.fn(),
      removeAvatar: jest.fn(),
      replaceAvatar: jest.fn(),
      anonymizeById: jest.fn(),
    };
    roleResolver = { resolve: jest.fn() };
    storage = {
      putObject: jest.fn(),
      removeObject: jest.fn(),
      createDownloadUrl: jest.fn(),
    };
    service = new UsersService(
      repository as unknown as UsersRepository,
      roleResolver as unknown as RoleResolver,
      storage as unknown as SeaweedFsStorageService,
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
    expect(storage.removeObject).toHaveBeenCalledWith(`avatars/${userId}.webp`);
  });

  it('throws when removing an avatar for a missing user', async () => {
    repository.removeAvatar.mockResolvedValue(undefined);

    await expect(service.removeAvatar(userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('anonymizes and deletes the current account', async () => {
    repository.anonymizeById.mockResolvedValue({
      ...profile(),
      avatarKey: `avatars/${userId}.webp`,
    });
    roleResolver.resolve.mockResolvedValue([Role.Advisee, Role.Advisor]);

    await expect(service.deleteMe(userId)).resolves.toEqual(
      expect.objectContaining({
        id: userId,
        email: 'person@example.test',
        roles: [Role.Advisee, Role.Advisor],
      }),
    );
    expect(repository.anonymizeById).toHaveBeenCalledWith(userId);
    expect(storage.removeObject).toHaveBeenCalledWith(`avatars/${userId}.webp`);
  });

  it('throws when deleting a missing account', async () => {
    repository.anonymizeById.mockResolvedValue(undefined);
    roleResolver.resolve.mockResolvedValue([Role.Advisee]);

    await expect(service.deleteMe(userId)).rejects.toThrow(NotFoundException);
  });

  it('uploads a validated avatar and removes the replaced object', async () => {
    repository.replaceAvatar.mockResolvedValue({
      avatarKey: `avatars/${userId}/old.png`,
    });
    storage.putObject.mockResolvedValue(undefined);
    storage.removeObject.mockResolvedValue(undefined);

    const result = await service.uploadAvatar(userId, {
      buffer: Buffer.from('png-content'),
      mimetype: 'image/png',
      size: 11,
    });

    expect(result.avatarKey).toMatch(
      new RegExp(`^avatars/${userId}/[0-9a-f-]+\\.png$`),
    );
    expect(storage.putObject).toHaveBeenCalledWith({
      key: result.avatarKey,
      body: Buffer.from('png-content'),
      contentType: 'image/png',
    });
    expect(repository.replaceAvatar).toHaveBeenCalledWith(
      userId,
      result.avatarKey,
    );
    expect(storage.removeObject).toHaveBeenCalledWith(
      `avatars/${userId}/old.png`,
    );
  });

  it('rejects an unsupported avatar type before uploading', async () => {
    await expect(
      service.uploadAvatar(userId, {
        buffer: Buffer.from('not-an-image'),
        mimetype: 'text/plain',
        size: 12,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it('requires a non-empty avatar within the size limit', async () => {
    await expect(service.uploadAvatar(userId, undefined)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.uploadAvatar(userId, {
        buffer: Buffer.alloc(0),
        mimetype: 'image/png',
        size: 0,
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.uploadAvatar(userId, {
        buffer: Buffer.alloc(1),
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it('maps an unavailable storage service to 503', async () => {
    storage.putObject.mockRejectedValue(new Error('connection refused'));

    await expect(
      service.uploadAvatar(userId, {
        buffer: Buffer.from('png-content'),
        mimetype: 'image/png',
        size: 11,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('returns a short-lived avatar URL for the owner', async () => {
    repository.findById.mockResolvedValue({
      ...profile(),
      avatarKey: `avatars/${userId}/current.webp`,
    });
    storage.createDownloadUrl.mockResolvedValue('http://seaweedfs.test/signed');

    await expect(service.getAvatarUrl(userId)).resolves.toEqual({
      url: 'http://seaweedfs.test/signed',
      expiresInSeconds: 300,
    });
    expect(storage.createDownloadUrl).toHaveBeenCalledWith(
      `avatars/${userId}/current.webp`,
      300,
    );
  });

  it('does not create an avatar URL for a missing profile or avatar', async () => {
    repository.findById.mockResolvedValueOnce(undefined);
    await expect(service.getAvatarUrl(userId)).rejects.toThrow(
      NotFoundException,
    );

    repository.findById.mockResolvedValueOnce(profile());
    await expect(service.getAvatarUrl(userId)).rejects.toThrow(
      NotFoundException,
    );
    expect(storage.createDownloadUrl).not.toHaveBeenCalled();
  });

  it('maps an unavailable avatar URL service to 503', async () => {
    repository.findById.mockResolvedValue({
      ...profile(),
      avatarKey: `avatars/${userId}/current.webp`,
    });
    storage.createDownloadUrl.mockRejectedValue(
      new Error('connection refused'),
    );

    await expect(service.getAvatarUrl(userId)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('cleans up a newly stored avatar if replacing its database key fails', async () => {
    const databaseError = new Error('database unavailable');
    repository.replaceAvatar.mockRejectedValue(databaseError);
    storage.removeObject.mockResolvedValue(undefined);

    await expect(
      service.uploadAvatar(userId, {
        buffer: Buffer.from('png-content'),
        mimetype: 'image/png',
        size: 11,
      }),
    ).rejects.toThrow(databaseError);
    expect(storage.removeObject).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^avatars/${userId}/`)),
    );
  });

  it('keeps a successful record deletion when object cleanup fails', async () => {
    repository.removeAvatar.mockResolvedValue({
      avatarKey: `avatars/${userId}/stale.webp`,
    });
    storage.removeObject.mockRejectedValue(new Error('storage unavailable'));
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await expect(service.removeAvatar(userId)).resolves.toEqual({
      avatarKey: `avatars/${userId}/stale.webp`,
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('stale.webp'),
      expect.any(String),
    );
  });
});
