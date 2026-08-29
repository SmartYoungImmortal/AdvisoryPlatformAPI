import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { AvailabilityService } from '@/modules/availability/availability.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import { BOOKING_MESSAGES } from './bookings.constants';
import { BookingsRepository } from './bookings.repository';
import { BookingResponseDto } from './dtos/booking-response.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly repository: BookingsRepository,
    private readonly availability: AvailabilityService,
  ) {}

  async create(
    user: SessionUser,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const service = await this.repository.findPublishedService(dto.serviceId);
    if (!service) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    if (service.advisorId === user.id)
      throw new BadRequestException(BOOKING_MESSAGES.selfBooking);
    if (
      service.screeningRequired &&
      !(await this.repository.hasAcceptedScreening(service.id, user.id))
    )
      throw new BadRequestException(BOOKING_MESSAGES.screeningRequired);
    const startTime = new Date(dto.startTime);
    if (Number.isNaN(startTime.getTime()))
      throw new BadRequestException(BOOKING_MESSAGES.unavailable);
    const slot = await this.availability.findSlotAt(dto.serviceId, startTime);
    if (!slot) throw new BadRequestException(BOOKING_MESSAGES.unavailable);
    try {
      const appointment = await this.repository.create({
        serviceId: service.id,
        advisorId: service.advisorId,
        adviseeId: user.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        unavailableUntil: new Date(
          slot.endTime.getTime() +
            (await this.availability.getGlobal(service.advisorId))
              .bufferMinutes *
              60000,
        ),
      });
      return new BookingResponseDto(appointment);
    } catch (error: unknown) {
      if (isExclusionViolation(error))
        throw new ConflictException(BOOKING_MESSAGES.conflict);
      throw error;
    }
  }

  async findMine(
    user: SessionUser,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    return paginateQuery(
      page,
      (options) => this.repository.findManyForAdvisee(user.id, options),
      () => this.repository.countForAdvisee(user.id),
      (item) => new BookingResponseDto(item),
    );
  }

  async findAdvisorMine(
    user: SessionUser,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    return paginateQuery(
      page,
      (options) => this.repository.findManyForAdvisor(user.id, options),
      () => this.repository.countForAdvisor(user.id),
      (item) => new BookingResponseDto(item),
    );
  }
}

function isExclusionViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23P01'
  );
}
