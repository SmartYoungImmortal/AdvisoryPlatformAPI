import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetOne,
  ApiDelete,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Role, Roles } from '@/common/decorators/roles.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { UserAvatarResponseDto } from './dtos/user-avatar-response.dto';
import { UserOwnProfileResponseDto } from './dtos/user-own-profile-response.dto';
import { USER_MESSAGES } from './users.constants';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Advisee)
  @Get('me')
  @ApiGetOne(UserOwnProfileResponseDto, { name: 'User profile' })
  getMe(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserOwnProfileResponseDto> {
    return this.usersService.getMe(currentUser.id);
  }

  @Roles(Role.Advisee)
  @Patch('me')
  @ResponseMessage(USER_MESSAGES.updated)
  @ApiUpdate(UserOwnProfileResponseDto, { name: 'User profile' })
  updateMe(
    @CurrentUser() currentUser: SessionUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserOwnProfileResponseDto> {
    return this.usersService.updateMe(currentUser.id, dto);
  }

  @Roles(Role.Advisee)
  @Delete('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(USER_MESSAGES.avatarRemoved)
  @ApiDelete(UserAvatarResponseDto, { name: 'Avatar' })
  removeAvatar(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserAvatarResponseDto> {
    return this.usersService.removeAvatar(currentUser.id);
  }

  @Roles(Role.Advisee)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(USER_MESSAGES.deleted)
  @ApiDelete(UserOwnProfileResponseDto, { name: 'Account' })
  deleteMe(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserOwnProfileResponseDto> {
    return this.usersService.deleteMe(currentUser.id);
  }
}
