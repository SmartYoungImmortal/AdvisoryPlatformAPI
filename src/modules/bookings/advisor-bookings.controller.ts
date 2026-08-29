import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiGetPaginated } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type {
  OffsetPaginationDto,
  PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
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
}
