import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { serviceAppointments } from '@/database/schema';
import { AvailabilityService } from '@/modules/availability/availability.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import {
  ALLOWED_SOURCE_STATES,
  reopensAvailability,
  type TransitionTarget,
} from './booking-states';
import {
  BOOKING_MESSAGES,
  BOOKING_NOTIFICATION_TITLES,
  invalidTransitionMessage,
  MEETING,
} from './bookings.constants';
import { BookingsRepository } from './bookings.repository';
import { AdvisorBookingResponseDto } from './dtos/advisor-booking-response.dto';
import { BookingResponseDto } from './dtos/booking-response.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { MeetingResponseDto } from './dtos/meeting-response.dto';
import { RescheduleBookingDto } from './dtos/reschedule-booking.dto';

type Appointment = InferSelectModel<typeof serviceAppointments>;
type NewAppointment = InferInsertModel<typeof serviceAppointments>;
type AppointmentUpdate = Parameters<BookingsRepository['transition']>[2];

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly repository: BookingsRepository,
    private readonly availability: AvailabilityService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    user: SessionUser,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const service = await this.repository.findPublishedService(dto.serviceId);
    if (!service) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    if (service.advisorId === user.id)
      throw new BadRequestException(BOOKING_MESSAGES.selfBooking);
    const startTime = this.parseStartTime(dto.startTime);
    const appointment = await this.claimSlot(() =>
      this.repository.createWithSchedulingLock(service.advisorId, () =>
        this.scheduledValues(
          service.id,
          service.advisorId,
          user.id,
          startTime,
          dto.packageId,
        ),
      ),
    );
    return new BookingResponseDto(appointment);
  }

  async findOne(
    user: SessionUser,
    bookingId: string,
  ): Promise<BookingResponseDto> {
    const appointment = await this.repository.findForParticipant(
      bookingId,
      user.id,
    );
    if (!appointment) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    return new BookingResponseDto(appointment);
  }

  /**
   * The session's video room, for either participant. A booked appointment's room opens
   * `MEETING.opensMinutesBefore` its start and closes at its end; one the Advisor has started
   * stays open, so a dropped call can be rejoined when the session runs over. The room is named
   * the first time it is opened, which also gives appointments booked before rooms existed one.
   */
  async openMeeting(
    user: SessionUser,
    bookingId: string,
  ): Promise<MeetingResponseDto> {
    const appointment = await this.repository.findForParticipant(
      bookingId,
      user.id,
    );
    if (!appointment) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    if (appointment.state !== 'BOOKED' && appointment.state !== 'IN_PROGRESS')
      throw new ConflictException(BOOKING_MESSAGES.meetingUnavailable);
    if (appointment.state === 'BOOKED') {
      const now = Date.now();
      const opensAt =
        appointment.startTime.getTime() - MEETING.opensMinutesBefore * 60000;
      if (now < opensAt)
        throw new BadRequestException(BOOKING_MESSAGES.meetingNotOpen);
      if (now > appointment.endTime.getTime())
        throw new BadRequestException(BOOKING_MESSAGES.meetingEnded);
    }
    const roomName =
      appointment.jitsiRoomName ??
      (await this.repository.nameMeetingRoom(
        appointment.id,
        `${MEETING.roomPrefix}${randomUUID()}`,
      ));
    return new MeetingResponseDto(
      `${MEETING.baseUrl}/${encodeURIComponent(roomName)}`,
    );
  }

  findMine(
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

  findAdvisorMine(
    user: SessionUser,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<AdvisorBookingResponseDto>> {
    return paginateQuery(
      page,
      (options) => this.repository.findManyForAdvisor(user.id, options),
      () => this.repository.countForAdvisor(user.id),
      (item) => new AdvisorBookingResponseDto(item),
    );
  }

  cancelAsAdvisee(
    user: SessionUser,
    bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.cancel(
      this.repository.findForAdvisee(bookingId, user.id),
      user.id,
    );
  }

  cancelAsAdvisor(
    user: SessionUser,
    bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.cancel(
      this.repository.findForAdvisor(bookingId, user.id),
      user.id,
    );
  }

  async start(
    user: SessionUser,
    bookingId: string,
  ): Promise<BookingResponseDto> {
    await this.assertAdvisorOwns(bookingId, user.id);
    return this.applyTransition(bookingId, 'IN_PROGRESS', {
      state: 'IN_PROGRESS',
    });
  }

  async complete(
    user: SessionUser,
    bookingId: string,
  ): Promise<BookingResponseDto> {
    await this.assertAdvisorOwns(bookingId, user.id);
    return this.applyTransition(bookingId, 'COMPLETED', { state: 'COMPLETED' });
  }

  async recordNoShow(
    user: SessionUser,
    bookingId: string,
  ): Promise<BookingResponseDto> {
    const appointment = await this.assertAdvisorOwns(bookingId, user.id);
    if (appointment.startTime > new Date())
      throw new BadRequestException(BOOKING_MESSAGES.noShowTooEarly);
    return this.applyTransition(bookingId, 'NO_SHOW', { state: 'NO_SHOW' });
  }

  /**
   * A reschedule is a cancellation plus a replacement booking rather than an update in
   * place, so the original row survives as history and the replacement carries the
   * payment state the Advisee already reached, and the chat room: the two people
   * carry on the conversation they already had rather than starting a second one.
   */
  async reschedule(
    user: SessionUser,
    bookingId: string,
    dto: RescheduleBookingDto,
  ): Promise<BookingResponseDto> {
    const original = await this.repository.findForAdvisee(bookingId, user.id);
    if (!original) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    const startTime = this.parseStartTime(dto.startTime);
    const cancellation = await this.cancellationValues(original, user.id);
    const replacement = await this.claimSlot(() =>
      this.repository.rescheduleWithSchedulingLock(
        original.advisorId,
        bookingId,
        ALLOWED_SOURCE_STATES.CANCELLED,
        cancellation,
        async (current) => ({
          // The same package, so the new time is the same length.
          ...(await this.scheduledValues(
            current.serviceId,
            current.advisorId,
            user.id,
            startTime,
            current.packageId,
          )),
          state: current.state,
          chatRoomId: current.chatRoomId,
        }),
      ),
    );
    if (!replacement) throw this.invalidTransition('CANCELLED');
    return new BookingResponseDto(replacement);
  }

  /**
   * The payment module's seam into the state machine. It is idempotent because a
   * signed webhook may be redelivered: an appointment that already left
   * `PENDING_PAYMENT` is returned unchanged rather than rejected.
   */
  async confirmPayment(bookingId: string): Promise<BookingResponseDto> {
    const appointment = await this.repository.transition(
      bookingId,
      ALLOWED_SOURCE_STATES.BOOKED,
      { state: 'BOOKED' },
    );
    if (appointment) {
      await this.notifyConfirmed(appointment);
      return new BookingResponseDto(appointment);
    }
    const existing = await this.repository.findById(bookingId);
    if (!existing) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    return new BookingResponseDto(existing);
  }

  /**
   * Tells both parties. Only the call that actually moved the appointment to BOOKED gets here, so a
   * redelivered webhook does not notify twice. A failure here must not undo the payment.
   */
  private async notifyConfirmed(appointment: Appointment): Promise<void> {
    try {
      const service = await this.repository.findPublishedService(
        appointment.serviceId,
      );
      // The Service's name is its stored text in both languages: `findPublishedService` reads the
      // row itself, not its translations. Only the date is written the way each language writes one.
      const describe = (dateLocale: string) => {
        const when = new Intl.DateTimeFormat(dateLocale, {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Bangkok',
        }).format(appointment.startTime);
        return service ? `${service.name} · ${when}` : when;
      };
      const content = describe('th-TH');
      const contentEn = describe('en-GB');
      await Promise.all([
        this.notifications.notify({
          ownerId: appointment.adviseeId,
          type: 'BOOKING_CONFIRMED',
          title: BOOKING_NOTIFICATION_TITLES.confirmed.th,
          content,
          en: {
            title: BOOKING_NOTIFICATION_TITLES.confirmed.en,
            content: contentEn,
          },
          resourceId: appointment.id,
        }),
        this.notifications.notify({
          ownerId: appointment.advisorId,
          type: 'BOOKING_RECEIVED',
          title: BOOKING_NOTIFICATION_TITLES.received.th,
          content,
          en: {
            title: BOOKING_NOTIFICATION_TITLES.received.en,
            content: contentEn,
          },
          resourceId: appointment.id,
        }),
      ]);
    } catch (error: unknown) {
      this.logger.warn(
        `Could not notify booking ${appointment.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async cancel(
    lookup: Promise<Appointment | undefined>,
    cancelledByUserId: string,
  ): Promise<BookingResponseDto> {
    const appointment = await lookup;
    if (!appointment) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    return this.applyTransition(
      appointment.id,
      'CANCELLED',
      await this.cancellationValues(appointment, cancelledByUserId),
    );
  }

  /**
   * `blocksAvailability` is the whole mechanism for giving the time back: both the
   * partial exclusion constraint and slot derivation read that column.
   */
  private async cancellationValues(
    appointment: Appointment,
    cancelledByUserId: string,
  ): Promise<AppointmentUpdate> {
    const global = await this.availability.getGlobal(appointment.advisorId);
    const cancelledAt = new Date();
    return {
      state: 'CANCELLED',
      cancelledAt,
      cancelledByUserId,
      blocksAvailability: !reopensAvailability(
        appointment.startTime,
        cancelledAt,
        global.minimumBookingNoticeMinutes,
      ),
    };
  }

  private async applyTransition(
    bookingId: string,
    target: TransitionTarget,
    values: AppointmentUpdate,
  ): Promise<BookingResponseDto> {
    const appointment = await this.repository.transition(
      bookingId,
      ALLOWED_SOURCE_STATES[target],
      values,
    );
    if (!appointment) throw this.invalidTransition(target);
    return new BookingResponseDto(appointment);
  }

  private async assertAdvisorOwns(
    bookingId: string,
    advisorId: string,
  ): Promise<Appointment> {
    const appointment = await this.repository.findForAdvisor(
      bookingId,
      advisorId,
    );
    if (!appointment) throw new NotFoundException(BOOKING_MESSAGES.notFound);
    return appointment;
  }

  private async scheduledValues(
    serviceId: string,
    advisorId: string,
    adviseeId: string,
    startTime: Date,
    packageId?: string | null,
  ): Promise<NewAppointment> {
    const slot = await this.availability.findSlotAt(
      serviceId,
      startTime,
      adviseeId,
      packageId,
    );
    if (!slot) throw new BadRequestException(BOOKING_MESSAGES.unavailable);
    const global = await this.availability.getGlobal(advisorId);
    return {
      serviceId,
      packageId: packageId ?? null,
      advisorId,
      adviseeId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      unavailableUntil: new Date(
        slot.endTime.getTime() + global.bufferMinutes * 60000,
      ),
    };
  }

  private parseStartTime(value: string): Date {
    const startTime = new Date(value);
    if (Number.isNaN(startTime.getTime()))
      throw new BadRequestException(BOOKING_MESSAGES.unavailable);
    return startTime;
  }

  /** The exclusion constraint, not the application, decides the last writer. */
  private async claimSlot<T>(claim: () => Promise<T>): Promise<T> {
    try {
      return await claim();
    } catch (error: unknown) {
      if (isExclusionViolation(error))
        throw new ConflictException(BOOKING_MESSAGES.conflict);
      throw error;
    }
  }

  private invalidTransition(target: TransitionTarget): ConflictException {
    return new ConflictException(
      invalidTransitionMessage(target, ALLOWED_SOURCE_STATES[target]),
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
