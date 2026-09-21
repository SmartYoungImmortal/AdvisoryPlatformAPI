import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type {
  advisorGlobalAvailability,
  serviceAppointments,
  services,
} from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AvailabilityService } from '@/modules/availability/availability.service';
import type { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';

type Appointment = InferSelectModel<typeof serviceAppointments>;
type AdvisorService = InferSelectModel<typeof services>;
type GlobalAvailability = InferSelectModel<typeof advisorGlobalAvailability>;

const advisee = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const advisor = { id: '22222222-2222-2222-2222-222222222222' } as SessionUser;
const serviceId = '33333333-3333-3333-3333-333333333333';
const bookingId = '44444444-4444-4444-4444-444444444444';
const startTime = new Date('2026-09-20T03:00:00.000Z');
const endTime = new Date('2026-09-20T04:00:00.000Z');

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: bookingId,
    serviceId,
    advisorId: advisor.id,
    adviseeId: advisee.id,
    type: 'CONSULTATION',
    startTime,
    endTime,
    unavailableUntil: endTime,
    blocksAvailability: true,
    cancelledByUserId: null,
    cancelledAt: null,
    chatRoomId: null,
    jitsiRoomName: null,
    state: 'PENDING_PAYMENT',
    createdAt: new Date('2026-09-12T00:00:00.000Z'),
    modifiedAt: new Date('2026-09-12T00:00:00.000Z'),
    ...overrides,
  };
}

function makeGlobal(
  overrides: Partial<GlobalAvailability> = {},
): GlobalAvailability {
  return {
    advisorId: advisor.id,
    slotIntervalMinutes: 30,
    bufferMinutes: 0,
    bookingHorizonDays: 60,
    minimumBookingNoticeMinutes: 0,
    dailyConsultationLimitMinutes: null,
    createdAt: new Date('2026-09-12T00:00:00.000Z'),
    modifiedAt: new Date('2026-09-12T00:00:00.000Z'),
    ...overrides,
  };
}

describe('BookingsService', () => {
  let service: BookingsService;
  let repository: jest.Mocked<
    Pick<
      BookingsRepository,
      | 'findPublishedService'
      | 'createWithSchedulingLock'
      | 'rescheduleWithSchedulingLock'
      | 'transition'
      | 'findById'
      | 'findForParticipant'
      | 'findForAdvisee'
      | 'findForAdvisor'
      | 'findManyForAdvisee'
      | 'countForAdvisee'
      | 'findManyForAdvisor'
      | 'countForAdvisor'
    >
  >;
  let availability: jest.Mocked<
    Pick<AvailabilityService, 'findSlotAt' | 'getGlobal'>
  >;

  beforeEach(() => {
    repository = {
      findPublishedService: jest.fn(),
      createWithSchedulingLock: jest.fn(),
      rescheduleWithSchedulingLock: jest.fn(),
      transition: jest.fn(),
      findById: jest.fn(),
      findForParticipant: jest.fn(),
      findForAdvisee: jest.fn(),
      findForAdvisor: jest.fn(),
      findManyForAdvisee: jest.fn(),
      countForAdvisee: jest.fn(),
      findManyForAdvisor: jest.fn(),
      countForAdvisor: jest.fn(),
    };
    availability = { findSlotAt: jest.fn(), getGlobal: jest.fn() };
    availability.getGlobal.mockResolvedValue(makeGlobal());
    service = new BookingsService(
      repository as unknown as BookingsRepository,
      availability as unknown as AvailabilityService,
    );
  });

  describe('create', () => {
    beforeEach(() => {
      repository.findPublishedService.mockResolvedValue({
        id: serviceId,
        advisorId: advisor.id,
      } as AdvisorService);
      availability.findSlotAt.mockResolvedValue({ startTime, endTime });
    });

    it('creates a PENDING_PAYMENT appointment for the derived slot', async () => {
      repository.createWithSchedulingLock.mockImplementation(
        async (_advisorId, values) => makeAppointment(await values()),
      );

      const booking = await service.create(advisee, {
        serviceId,
        startTime: startTime.toISOString(),
      });

      expect(booking.state).toBe('PENDING_PAYMENT');
      expect(booking.startTime).toEqual(startTime);
      expect(repository.createWithSchedulingLock).toHaveBeenCalledWith(
        advisor.id,
        expect.any(Function),
      );
    });

    it('adds the global buffer to the range the appointment blocks', async () => {
      availability.getGlobal.mockResolvedValue(
        makeGlobal({ bufferMinutes: 15 }),
      );
      repository.createWithSchedulingLock.mockImplementation(
        async (_advisorId, values) => makeAppointment(await values()),
      );

      const booking = await service.create(advisee, {
        serviceId,
        startTime: startTime.toISOString(),
      });

      expect(booking.unavailableUntil).toEqual(
        new Date(endTime.getTime() + 15 * 60000),
      );
    });

    it('rejects an Advisor booking their own service', async () => {
      await expect(
        service.create(advisor, {
          serviceId,
          startTime: startTime.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a start time that is not a derived slot', async () => {
      availability.findSlotAt.mockResolvedValue(undefined);
      repository.createWithSchedulingLock.mockImplementation(
        async (_advisorId, values) => makeAppointment(await values()),
      );

      await expect(
        service.create(advisee, {
          serviceId,
          startTime: startTime.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps the exclusion constraint violation to a conflict', async () => {
      repository.createWithSchedulingLock.mockRejectedValue({ code: '23P01' });

      await expect(
        service.create(advisee, {
          serviceId,
          startTime: startTime.toISOString(),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows a database error that is not an exclusion violation', async () => {
      const failure = { code: '23505' };
      repository.createWithSchedulingLock.mockRejectedValue(failure);

      await expect(
        service.create(advisee, {
          serviceId,
          startTime: startTime.toISOString(),
        }),
      ).rejects.toBe(failure);
    });
  });

  describe('findOne', () => {
    it('returns an appointment the caller participates in', async () => {
      repository.findForParticipant.mockResolvedValue(makeAppointment());

      const booking = await service.findOne(advisor, bookingId);

      expect(booking.id).toBe(bookingId);
      expect(repository.findForParticipant).toHaveBeenCalledWith(
        bookingId,
        advisor.id,
      );
    });

    it('hides an appointment the caller is not part of', async () => {
      repository.findForParticipant.mockResolvedValue(undefined);

      await expect(service.findOne(advisee, bookingId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('participant lists', () => {
    it('scopes the Advisee list to the session user', async () => {
      repository.findManyForAdvisee.mockResolvedValue([makeAppointment()]);
      repository.countForAdvisee.mockResolvedValue(1);

      const page = await service.findMine(advisee, new OffsetPaginationDto());

      expect(page.total).toBe(1);
      expect(repository.findManyForAdvisee).toHaveBeenCalledWith(
        advisee.id,
        expect.anything(),
      );
    });

    it('scopes the Advisor list to the session user', async () => {
      repository.findManyForAdvisor.mockResolvedValue([makeAppointment()]);
      repository.countForAdvisor.mockResolvedValue(1);

      const page = await service.findAdvisorMine(
        advisor,
        new OffsetPaginationDto(),
      );

      expect(page.total).toBe(1);
      expect(repository.findManyForAdvisor).toHaveBeenCalledWith(
        advisor.id,
        expect.anything(),
      );
    });
  });

  describe('cancellation', () => {
    it('reopens the range when the minimum notice still holds', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-20T00:00:00.000Z'));
      availability.getGlobal.mockResolvedValue(
        makeGlobal({ minimumBookingNoticeMinutes: 60 }),
      );
      repository.findForAdvisee.mockResolvedValue(makeAppointment());
      repository.transition.mockResolvedValue(
        makeAppointment({ state: 'CANCELLED', blocksAvailability: false }),
      );

      await service.cancelAsAdvisee(advisee, bookingId);

      expect(repository.transition).toHaveBeenCalledWith(
        bookingId,
        ['PENDING_PAYMENT', 'BOOKED'],
        expect.objectContaining({
          state: 'CANCELLED',
          cancelledByUserId: advisee.id,
          blocksAvailability: false,
        }),
      );
      jest.useRealTimers();
    });

    it('keeps the range blocked inside the minimum notice', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-20T02:45:00.000Z'));
      availability.getGlobal.mockResolvedValue(
        makeGlobal({ minimumBookingNoticeMinutes: 60 }),
      );
      repository.findForAdvisor.mockResolvedValue(makeAppointment());
      repository.transition.mockResolvedValue(
        makeAppointment({ state: 'CANCELLED' }),
      );

      await service.cancelAsAdvisor(advisor, bookingId);

      expect(repository.transition).toHaveBeenCalledWith(
        bookingId,
        ['PENDING_PAYMENT', 'BOOKED'],
        expect.objectContaining({
          cancelledByUserId: advisor.id,
          blocksAvailability: true,
        }),
      );
      jest.useRealTimers();
    });

    it('records the cancelling party rather than the Advisee', async () => {
      repository.findForAdvisor.mockResolvedValue(makeAppointment());
      repository.transition.mockResolvedValue(
        makeAppointment({
          state: 'CANCELLED',
          cancelledByUserId: advisor.id,
          cancelledAt: new Date(),
        }),
      );

      const booking = await service.cancelAsAdvisor(advisor, bookingId);

      expect(booking.cancelledByUserId).toBe(advisor.id);
    });

    it('hides a booking the caller does not own', async () => {
      repository.findForAdvisee.mockResolvedValue(undefined);

      await expect(
        service.cancelAsAdvisee(advisee, bookingId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.transition).not.toHaveBeenCalled();
    });

    it('reports a conflict when the state is no longer cancellable', async () => {
      repository.findForAdvisee.mockResolvedValue(
        makeAppointment({ state: 'COMPLETED' }),
      );
      repository.transition.mockResolvedValue(undefined);

      await expect(
        service.cancelAsAdvisee(advisee, bookingId),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('advisor transitions', () => {
    it('starts a booked appointment', async () => {
      repository.findForAdvisor.mockResolvedValue(
        makeAppointment({ state: 'BOOKED' }),
      );
      repository.transition.mockResolvedValue(
        makeAppointment({ state: 'IN_PROGRESS' }),
      );

      const booking = await service.start(advisor, bookingId);

      expect(booking.state).toBe('IN_PROGRESS');
      expect(repository.transition).toHaveBeenCalledWith(
        bookingId,
        ['BOOKED'],
        { state: 'IN_PROGRESS' },
      );
    });

    it('completes an in-progress appointment', async () => {
      repository.findForAdvisor.mockResolvedValue(
        makeAppointment({ state: 'IN_PROGRESS' }),
      );
      repository.transition.mockResolvedValue(
        makeAppointment({ state: 'COMPLETED' }),
      );

      const booking = await service.complete(advisor, bookingId);

      expect(booking.state).toBe('COMPLETED');
      expect(repository.transition).toHaveBeenCalledWith(
        bookingId,
        ['IN_PROGRESS'],
        { state: 'COMPLETED' },
      );
    });

    it('refuses a transition on a booking owned by another Advisor', async () => {
      repository.findForAdvisor.mockResolvedValue(undefined);

      await expect(service.start(advisor, bookingId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.transition).not.toHaveBeenCalled();
    });

    it('refuses a no-show before the appointment starts', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-20T02:59:00.000Z'));
      repository.findForAdvisor.mockResolvedValue(
        makeAppointment({ state: 'BOOKED' }),
      );

      await expect(
        service.recordNoShow(advisor, bookingId),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.transition).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('records a no-show once the appointment has started', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-20T03:01:00.000Z'));
      repository.findForAdvisor.mockResolvedValue(
        makeAppointment({ state: 'BOOKED' }),
      );
      repository.transition.mockResolvedValue(
        makeAppointment({ state: 'NO_SHOW' }),
      );

      const booking = await service.recordNoShow(advisor, bookingId);

      expect(booking.state).toBe('NO_SHOW');
      expect(repository.transition).toHaveBeenCalledWith(
        bookingId,
        ['BOOKED'],
        { state: 'NO_SHOW' },
      );
      jest.useRealTimers();
    });

    it('reports a conflict when a concurrent caller already moved the state', async () => {
      repository.findForAdvisor.mockResolvedValue(
        makeAppointment({ state: 'BOOKED' }),
      );
      repository.transition.mockResolvedValue(undefined);

      await expect(service.start(advisor, bookingId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('reschedule', () => {
    const newStart = new Date('2026-09-21T03:00:00.000Z');
    const newEnd = new Date('2026-09-21T04:00:00.000Z');

    beforeEach(() => {
      availability.findSlotAt.mockResolvedValue({
        startTime: newStart,
        endTime: newEnd,
      });
    });

    it('carries the paid state onto the replacement appointment', async () => {
      const original = makeAppointment({ state: 'BOOKED' });
      repository.findForAdvisee.mockResolvedValue(original);
      repository.rescheduleWithSchedulingLock.mockImplementation(
        async (_advisorId, _bookingId, _states, _cancellation, values) =>
          makeAppointment(await values(original)),
      );

      const booking = await service.reschedule(advisee, bookingId, {
        startTime: newStart.toISOString(),
      });

      expect(booking.state).toBe('BOOKED');
      expect(booking.startTime).toEqual(newStart);
    });

    it('leaves an unpaid appointment pending payment', async () => {
      const original = makeAppointment();
      repository.findForAdvisee.mockResolvedValue(original);
      repository.rescheduleWithSchedulingLock.mockImplementation(
        async (_advisorId, _bookingId, _states, _cancellation, values) =>
          makeAppointment(await values(original)),
      );

      const booking = await service.reschedule(advisee, bookingId, {
        startTime: newStart.toISOString(),
      });

      expect(booking.state).toBe('PENDING_PAYMENT');
    });

    it('cancels the original under the same Advisor lock', async () => {
      const original = makeAppointment();
      repository.findForAdvisee.mockResolvedValue(original);
      repository.rescheduleWithSchedulingLock.mockImplementation(
        async (_advisorId, _bookingId, _states, _cancellation, values) =>
          makeAppointment(await values(original)),
      );

      await service.reschedule(advisee, bookingId, {
        startTime: newStart.toISOString(),
      });

      expect(repository.rescheduleWithSchedulingLock).toHaveBeenCalledWith(
        advisor.id,
        bookingId,
        ['PENDING_PAYMENT', 'BOOKED'],
        expect.objectContaining({
          state: 'CANCELLED',
          cancelledByUserId: advisee.id,
        }),
        expect.any(Function),
      );
    });

    it('reports a conflict when the original is no longer cancellable', async () => {
      repository.findForAdvisee.mockResolvedValue(
        makeAppointment({ state: 'CANCELLED' }),
      );
      repository.rescheduleWithSchedulingLock.mockResolvedValue(undefined);

      await expect(
        service.reschedule(advisee, bookingId, {
          startTime: newStart.toISOString(),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps a lost exclusion race on the new time to a conflict', async () => {
      repository.findForAdvisee.mockResolvedValue(makeAppointment());
      repository.rescheduleWithSchedulingLock.mockRejectedValue({
        code: '23P01',
      });

      await expect(
        service.reschedule(advisee, bookingId, {
          startTime: newStart.toISOString(),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hides a booking the caller does not own', async () => {
      repository.findForAdvisee.mockResolvedValue(undefined);

      await expect(
        service.reschedule(advisee, bookingId, {
          startTime: newStart.toISOString(),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('confirmPayment', () => {
    it('moves a pending appointment to BOOKED', async () => {
      repository.transition.mockResolvedValue(
        makeAppointment({ state: 'BOOKED' }),
      );

      const booking = await service.confirmPayment(bookingId);

      expect(booking.state).toBe('BOOKED');
      expect(repository.transition).toHaveBeenCalledWith(
        bookingId,
        ['PENDING_PAYMENT'],
        { state: 'BOOKED' },
      );
    });

    it('is idempotent for a redelivered webhook', async () => {
      repository.transition.mockResolvedValue(undefined);
      repository.findById.mockResolvedValue(
        makeAppointment({ state: 'BOOKED' }),
      );

      const booking = await service.confirmPayment(bookingId);

      expect(booking.state).toBe('BOOKED');
    });

    it('reports a missing appointment rather than inventing one', async () => {
      repository.transition.mockResolvedValue(undefined);
      repository.findById.mockResolvedValue(undefined);

      await expect(service.confirmPayment(bookingId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
