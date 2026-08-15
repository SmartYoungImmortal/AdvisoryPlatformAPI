import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetOne,
  ApiUpdate,
} from '../../common/decorators/api-docs.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import type { SessionUser } from '../auth/auth.config';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { UserOwnProfileResponseDto } from './dtos/user-own-profile-response.dto';
import { USER_MESSAGES } from './users.constants';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Advisee)
  @Get('me')
  @ApiGetOne(UserOwnProfileResponseDto, 'User profile')
  getMe(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserOwnProfileResponseDto> {
    return this.usersService.getMe(currentUser.id);
  }

  @Roles(Role.Advisee)
  @Patch('me')
  @ResponseMessage(USER_MESSAGES.updated)
  @ApiUpdate(UserOwnProfileResponseDto, 'User profile')
  updateMe(
    @CurrentUser() currentUser: SessionUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserOwnProfileResponseDto> {
    return this.usersService.updateMe(currentUser.id, dto);
  }
}
