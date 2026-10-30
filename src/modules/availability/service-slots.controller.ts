import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetMany } from '@/common/decorators/api-docs.decorator';
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
  constructor(private readonly availability: AvailabilityService) {}

  /**
   * Any signed-in account may read a service's open times, the same accounts
   * `POST /bookings` takes: every account is an Advisee, and an Advisor who
   * also books sessions is one too. Booking one's own service is refused
   * where the booking is made (`BOOKING_MESSAGES.selfBooking`), not here.
   */
  @Get(':serviceId/slots')
  @ApiGetMany(AvailabilitySlotResponseDto, { name: 'Available slots' })
  findSlots(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: SlotQueryDto,
  ): Promise<AvailabilitySlotResponseDto[]> {
    return this.availability.findSlots(serviceId, query, user.id);
  }
}
