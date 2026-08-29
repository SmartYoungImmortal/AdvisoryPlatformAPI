import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiCreate,
  ApiDelete,
  ApiGetOne,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AVAILABILITY_MESSAGES } from './availability.constants';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityProfileResponseDto,
  GlobalAvailabilityResponseDto,
  UpsertAvailabilityProfileDto,
  UpsertGlobalAvailabilityDto,
} from './dtos/availability.dto';

@ApiTags('Availability')
@Controller('advisors/me/availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}
  @UserHasPermission({ permission: { advisor: ['read'] } })
  @Get('global')
  @ApiGetOne(GlobalAvailabilityResponseDto, { name: 'Global availability' })
  getGlobal(
    @CurrentUser() user: SessionUser,
  ): Promise<GlobalAvailabilityResponseDto> {
    return this.availability
      .getGlobal(user.id)
      .then((global) => new GlobalAvailabilityResponseDto(global));
  }
  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Put('global')
  @ResponseMessage(AVAILABILITY_MESSAGES.globalUpdated)
  @ApiUpdate(GlobalAvailabilityResponseDto, { name: 'Global availability' })
  upsertGlobal(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpsertGlobalAvailabilityDto,
  ): Promise<GlobalAvailabilityResponseDto> {
    return this.availability
      .upsertGlobal(user.id, dto)
      .then((global) => new GlobalAvailabilityResponseDto(global));
  }
  @UserHasPermission({ permission: { advisor: ['read'] } })
  @Get('profiles')
  findProfiles(
    @CurrentUser() user: SessionUser,
  ): Promise<AvailabilityProfileResponseDto[]> {
    return this.availability
      .findProfiles(user.id)
      .then((profiles) =>
        profiles.map((profile) => new AvailabilityProfileResponseDto(profile)),
      );
  }
  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post('profiles')
  @ResponseMessage(AVAILABILITY_MESSAGES.profileCreated)
  @ApiCreate(AvailabilityProfileResponseDto, { name: 'Availability profile' })
  createProfile(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpsertAvailabilityProfileDto,
  ): Promise<AvailabilityProfileResponseDto> {
    return this.availability
      .createProfile(user.id, dto)
      .then((profile) => new AvailabilityProfileResponseDto(profile));
  }
  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Patch('profiles/:profileId')
  @ResponseMessage(AVAILABILITY_MESSAGES.profileUpdated)
  @ApiUpdate(AvailabilityProfileResponseDto, { name: 'Availability profile' })
  updateProfile(
    @CurrentUser() user: SessionUser,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: UpsertAvailabilityProfileDto,
  ): Promise<AvailabilityProfileResponseDto> {
    return this.availability
      .updateProfile(user.id, profileId, dto)
      .then((profile) => new AvailabilityProfileResponseDto(profile));
  }
  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Delete('profiles/:profileId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AVAILABILITY_MESSAGES.profileDeleted)
  @ApiDelete(AvailabilityProfileResponseDto, { name: 'Availability profile' })
  deleteProfile(
    @CurrentUser() user: SessionUser,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<AvailabilityProfileResponseDto> {
    return this.availability
      .deleteProfile(user.id, profileId)
      .then((profile) => new AvailabilityProfileResponseDto(profile));
  }
}
