import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleResolver } from '../../common/authorization/role-resolver.service';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { UserAvatarResponseDto } from './dtos/user-avatar-response.dto';
import { UserOwnProfileResponseDto } from './dtos/user-own-profile-response.dto';
import { USER_MESSAGES } from './users.constants';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly roleResolver: RoleResolver,
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

    return new UserAvatarResponseDto(avatar.avatarKey);
  }

  async deleteMe(userId: string): Promise<UserOwnProfileResponseDto> {
    const roles = await this.roleResolver.resolve(userId);
    const deleted = await this.usersRepository.anonymizeById(userId);
    if (!deleted) {
      throw new NotFoundException(USER_MESSAGES.notFound);
    }

    return new UserOwnProfileResponseDto(deleted, roles);
  }
}
