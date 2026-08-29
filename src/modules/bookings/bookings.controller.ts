import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiGetPaginated,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { BOOKING_MESSAGES } from './bookings.constants';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dtos/booking-response.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}
  @Post()
  @ResponseMessage(BOOKING_MESSAGES.created)
  @ApiCreate(BookingResponseDto, { name: 'Booking' })
  create(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookings.create(user, dto);
  }
  @Get('me')
  @ApiGetPaginated(BookingResponseDto, { name: 'Booking' })
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    return this.bookings.findMine(user, query);
  }
}
