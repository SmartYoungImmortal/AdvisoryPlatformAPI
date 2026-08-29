import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import {
  ApiCreate,
  ApiGetOne,
  ApiDelete,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { UserAvatarResponseDto } from './dtos/user-avatar-response.dto';
import { UserAvatarUrlResponseDto } from './dtos/user-avatar-url-response.dto';
import { UserOwnProfileResponseDto } from './dtos/user-own-profile-response.dto';
import { MAX_AVATAR_BYTES } from './avatar.constants';
import { USER_MESSAGES } from './users.constants';
import { UsersService } from './users.service';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UserHasPermission({
    permission: {
      profile: ['updateSelf'],
    },
  })
  @Get('me')
  @ApiGetOne(UserOwnProfileResponseDto, { name: 'User profile' })
  getMe(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserOwnProfileResponseDto> {
    return this.usersService.getMe(currentUser.id);
  }

  @UserHasPermission({
    permission: {
      profile: ['updateSelf'],
    },
  })
  @Patch('me')
  @ResponseMessage(USER_MESSAGES.updated)
  @ApiUpdate(UserOwnProfileResponseDto, { name: 'User profile' })
  updateMe(
    @CurrentUser() currentUser: SessionUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserOwnProfileResponseDto> {
    return this.usersService.updateMe(currentUser.id, dto);
  }

  @UserHasPermission({
    permission: {
      profile: ['updateSelf'],
    },
  })
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
    }),
  )
  @ResponseMessage(USER_MESSAGES.avatarUploaded)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreate(UserAvatarResponseDto, { name: 'Avatar' })
  uploadAvatar(
    @CurrentUser() currentUser: SessionUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UserAvatarResponseDto> {
    return this.usersService.uploadAvatar(currentUser.id, file);
  }

  @UserHasPermission({
    permission: {
      profile: ['read'],
    },
  })
  @Get('me/avatar')
  @ApiGetOne(UserAvatarUrlResponseDto, { name: 'Avatar URL' })
  getAvatarUrl(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserAvatarUrlResponseDto> {
    return this.usersService.getAvatarUrl(currentUser.id);
  }

  @UserHasPermission({
    permission: {
      profile: ['updateSelf'],
    },
  })
  @Delete('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(USER_MESSAGES.avatarRemoved)
  @ApiDelete(UserAvatarResponseDto, { name: 'Avatar' })
  removeAvatar(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserAvatarResponseDto> {
    return this.usersService.removeAvatar(currentUser.id);
  }

  @UserHasPermission({
    permission: {
      profile: ['deleteSelf'],
    },
  })
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
