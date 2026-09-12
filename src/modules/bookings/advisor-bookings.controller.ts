import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type {
  OffsetPaginationDto,
  PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { BOOKING_MESSAGES } from './bookings.constants';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dtos/booking-response.dto';

@ApiTags('Bookings')
@Controller('advisors/me/bookings')
export class AdvisorBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @UserHasPermission({ permission: { advisor: ['read'] } })
  @Get()
  @ApiGetPaginated(BookingResponseDto, { name: 'Booking' })
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    return this.bookings.findAdvisorMine(user, query);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post(':bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(BOOKING_MESSAGES.cancelled)
  @ApiUpdate(BookingResponseDto, { name: 'Booking' })
  cancel(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.bookings.cancelAsAdvisor(user, bookingId);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post(':bookingId/start')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(BOOKING_MESSAGES.started)
  @ApiUpdate(BookingResponseDto, { name: 'Booking' })
  start(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.bookings.start(user, bookingId);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post(':bookingId/complete')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(BOOKING_MESSAGES.completed)
  @ApiUpdate(BookingResponseDto, { name: 'Booking' })
  complete(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.bookings.complete(user, bookingId);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post(':bookingId/no-show')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(BOOKING_MESSAGES.noShowRecorded)
  @ApiUpdate(BookingResponseDto, { name: 'Booking' })
  recordNoShow(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.bookings.recordNoShow(user, bookingId);
  }
}
