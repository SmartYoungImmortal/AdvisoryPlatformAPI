import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetMany } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
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
   * Anyone may read a published service's open times, signed in or not, so a
   * visitor can see whether a time suits them before making an account.
   * Booking one still needs a session (`POST /bookings`).
   *
   * Public, but the session is still read when there is one (the guard sets
   * `request.user` on every route, or `null`): a screened service shows its
   * times only to an account whose screening was accepted, and to its owner,
   * so a visitor with no session is told it is screened, as an unscreened
   * account is. Booking one's own service is refused where the booking is
   * made (`BOOKING_MESSAGES.selfBooking`), not here.
   */
  @Public()
  @Get(':serviceId/slots')
  @ApiGetMany(AvailabilitySlotResponseDto, {
    name: 'Available slots',
    public: true,
  })
  findSlots(
    @CurrentUser() user: SessionUser | null,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: SlotQueryDto,
  ): Promise<AvailabilitySlotResponseDto[]> {
    return this.availability.findSlots(serviceId, query, user?.id ?? null);
  }
}
