import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ApiGetMany } from '@/common/decorators/api-docs.decorator';
import { Role } from '@/common/authorization/role.enum';
import { RoleResolver } from '@/common/authorization/role-resolver.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AvailabilityService } from './availability.service';
import {
  AvailabilitySlotResponseDto,
  SlotQueryDto,
} from './dtos/availability.dto';

@ApiTags('Availability')
@Controller('services')
export class ServiceSlotsController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly roleResolver: RoleResolver,
  ) {}

  @Get(':serviceId/slots')
  @Roles(['advisee'])
  @ApiGetMany(AvailabilitySlotResponseDto, { name: 'Available slots' })
  findSlots(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: SlotQueryDto,
  ): Promise<AvailabilitySlotResponseDto[]> {
    return this.roleResolver.resolve(user.id).then((roles) => {
      if (roles.some((role) => role !== Role.Advisee)) {
        throw new ForbiddenException();
      }

      return this.availability.findSlots(serviceId, query, user.id);
    });
  }
}
