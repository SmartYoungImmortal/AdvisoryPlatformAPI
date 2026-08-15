import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RoleResolver } from '@/common/authorization/role-resolver.service';
import { MinioStorageService } from '@/common/storage/minio-storage.service';
import {
  AVATAR_EXTENSIONS,
  AVATAR_URL_EXPIRY_SECONDS,
  MAX_AVATAR_BYTES,
} from './avatar.constants';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { UserAvatarResponseDto } from './dtos/user-avatar-response.dto';
import { UserAvatarUrlResponseDto } from './dtos/user-avatar-url-response.dto';
import { UserOwnProfileResponseDto } from './dtos/user-own-profile-response.dto';
import { USER_MESSAGES } from './users.constants';
import { UsersRepository } from './users.repository';

export interface AvatarUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly roleResolver: RoleResolver,
    private readonly storage: MinioStorageService,
  ) {}

  async getMe(userId: string): Promise<UserOwnProfileResponseDto> {
    const [profile, roles] = await Promise.all([
      this.usersRepository.findById(userId),
      this.roleResolver.resolve(userId),
    ]);

    if (!profile) {
      throw new NotFoundException(USER_MESSAGES.notFound);
    }

    return new UserOwnProfileResponseDto(profile, roles);
  }

  async updateMe(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserOwnProfileResponseDto> {
    const profile = await this.usersRepository.updateById(userId, {
      ...dto,
      updatedAt: new Date(),
    });

    if (!profile) {
      throw new NotFoundException(USER_MESSAGES.notFound);
    }

    const roles = await this.roleResolver.resolve(userId);
    return new UserOwnProfileResponseDto(profile, roles);
  }

  async removeAvatar(userId: string): Promise<UserAvatarResponseDto> {
    const avatar = await this.usersRepository.removeAvatar(userId);
    if (!avatar) {
      throw new NotFoundException(USER_MESSAGES.notFound);
    }

    if (avatar.avatarKey) {
      await this.removeObjectAfterRecordDelete(avatar.avatarKey);
    }

    return new UserAvatarResponseDto(avatar.avatarKey);
  }

  async uploadAvatar(
    userId: string,
    upload: AvatarUpload | undefined,
  ): Promise<UserAvatarResponseDto> {
    this.validateAvatarUpload(upload);
    const extension = AVATAR_EXTENSIONS[upload.mimetype];
    const avatarKey = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;

    try {
      await this.storage.putObject({
        key: avatarKey,
        body: upload.buffer,
        contentType: upload.mimetype,
      });
    } catch {
      throw new ServiceUnavailableException(USER_MESSAGES.storageUnavailable);
    }

    let previousAvatar: { avatarKey: string | null } | undefined;
    try {
      previousAvatar = await this.usersRepository.replaceAvatar(
        userId,
        avatarKey,
      );
    } catch (error: unknown) {
      await this.removeObjectAfterRecordDelete(avatarKey);
      throw error;
    }

    if (!previousAvatar) {
      await this.removeObjectAfterRecordDelete(avatarKey);
      throw new NotFoundException(USER_MESSAGES.notFound);
    }

    if (previousAvatar.avatarKey) {
      await this.removeObjectAfterRecordDelete(previousAvatar.avatarKey);
    }

    return new UserAvatarResponseDto(avatarKey);
  }

  async getAvatarUrl(userId: string): Promise<UserAvatarUrlResponseDto> {
    const profile = await this.usersRepository.findById(userId);
    if (!profile) {
      throw new NotFoundException(USER_MESSAGES.notFound);
    }
    if (!profile.avatarKey) {
      throw new NotFoundException(USER_MESSAGES.avatarNotFound);
    }

    try {
      const url = await this.storage.createDownloadUrl(
        profile.avatarKey,
        AVATAR_URL_EXPIRY_SECONDS,
      );
      return new UserAvatarUrlResponseDto(url, AVATAR_URL_EXPIRY_SECONDS);
    } catch {
      throw new ServiceUnavailableException(USER_MESSAGES.storageUnavailable);
    }
  }

  async deleteMe(userId: string): Promise<UserOwnProfileResponseDto> {
    const roles = await this.roleResolver.resolve(userId);
    const deleted = await this.usersRepository.anonymizeById(userId);
    if (!deleted) {
      throw new NotFoundException(USER_MESSAGES.notFound);
    }

    if (deleted.avatarKey) {
      await this.removeObjectAfterRecordDelete(deleted.avatarKey);
    }

    return new UserOwnProfileResponseDto(deleted, roles);
  }

  private validateAvatarUpload(
    upload: AvatarUpload | undefined,
  ): asserts upload is AvatarUpload {
    if (!upload || upload.size === 0) {
      throw new BadRequestException(USER_MESSAGES.avatarRequired);
    }
    if (!AVATAR_EXTENSIONS[upload.mimetype]) {
      throw new BadRequestException(USER_MESSAGES.avatarInvalidType);
    }
    if (upload.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException(USER_MESSAGES.avatarTooLarge);
    }
  }

  private async removeObjectAfterRecordDelete(key: string): Promise<void> {
    try {
      await this.storage.removeObject(key);
    } catch (error: unknown) {
      this.logger.warn(
        `Could not remove orphaned object ${key}; it must be cleaned up separately.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
