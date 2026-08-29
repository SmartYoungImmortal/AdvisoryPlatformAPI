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
  ApiGetMany,
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
  async getGlobal(
    @CurrentUser() user: SessionUser,
  ): Promise<GlobalAvailabilityResponseDto> {
    const global = await this.availability.getGlobal(user.id);
    return new GlobalAvailabilityResponseDto(global);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Put('global')
  @ResponseMessage(AVAILABILITY_MESSAGES.globalUpdated)
  @ApiUpdate(GlobalAvailabilityResponseDto, { name: 'Global availability' })
  async upsertGlobal(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpsertGlobalAvailabilityDto,
  ): Promise<GlobalAvailabilityResponseDto> {
    const global = await this.availability.upsertGlobal(user.id, dto);
    return new GlobalAvailabilityResponseDto(global);
  }
  @UserHasPermission({ permission: { advisor: ['read'] } })
  @Get('profiles')
  @ApiGetMany(AvailabilityProfileResponseDto, {
    name: 'Availability profiles',
  })
  async findProfiles(
    @CurrentUser() user: SessionUser,
  ): Promise<AvailabilityProfileResponseDto[]> {
    const profiles = await this.availability.findProfiles(user.id);
    return profiles.map(
      (profile) => new AvailabilityProfileResponseDto(profile),
    );
  }
  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post('profiles')
  @ResponseMessage(AVAILABILITY_MESSAGES.profileCreated)
  @ApiCreate(AvailabilityProfileResponseDto, { name: 'Availability profile' })
  async createProfile(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpsertAvailabilityProfileDto,
  ): Promise<AvailabilityProfileResponseDto> {
    const profile = await this.availability.createProfile(user.id, dto);
    return new AvailabilityProfileResponseDto(profile);
  }
  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Patch('profiles/:profileId')
  @ResponseMessage(AVAILABILITY_MESSAGES.profileUpdated)
  @ApiUpdate(AvailabilityProfileResponseDto, { name: 'Availability profile' })
  async updateProfile(
    @CurrentUser() user: SessionUser,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: UpsertAvailabilityProfileDto,
  ): Promise<AvailabilityProfileResponseDto> {
    const profile = await this.availability.updateProfile(
      user.id,
      profileId,
      dto,
    );
    return new AvailabilityProfileResponseDto(profile);
  }
  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Delete('profiles/:profileId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AVAILABILITY_MESSAGES.profileDeleted)
  @ApiDelete(AvailabilityProfileResponseDto, { name: 'Availability profile' })
  async deleteProfile(
    @CurrentUser() user: SessionUser,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<AvailabilityProfileResponseDto> {
    const profile = await this.availability.deleteProfile(user.id, profileId);
    return new AvailabilityProfileResponseDto(profile);
  }
}
