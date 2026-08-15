import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../../common/decorators/roles.decorator';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { UserOwnProfileResponseDto } from './dtos/user-own-profile-response.dto';
import { USER_MESSAGES } from './users.constants';
import { UsersRepository, type RoleMembership } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(userId: string): Promise<UserOwnProfileResponseDto> {
    const [profile, membership] = await Promise.all([
      this.usersRepository.findById(userId),
      this.usersRepository.findRoleMembership(userId),
    ]);

    if (!profile) {
      throw new NotFoundException(USER_MESSAGES.notFound);
    }

    return new UserOwnProfileResponseDto(
      profile,
      this.resolveRoles(membership),
    );
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

    const membership = await this.usersRepository.findRoleMembership(userId);
    return new UserOwnProfileResponseDto(
      profile,
      this.resolveRoles(membership),
    );
  }

  private resolveRoles(membership: RoleMembership): Role[] {
    const roles = [Role.Advisee];
    if (membership.isAdvisor) {
      roles.push(Role.Advisor);
    }
    if (membership.isAdmin) {
      roles.push(Role.Admin);
    }
    return roles;
  }
}
