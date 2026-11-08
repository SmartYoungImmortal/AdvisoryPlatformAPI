import type { InferSelectModel } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import type { serviceAppointments } from '@/database/schema';
import { openBookingChatRoom } from '@/modules/chat/booking-chat-room';
import { BookingsRepository } from './bookings.repository';

jest.mock('@/modules/chat/booking-chat-room', () => ({
  openBookingChatRoom: jest.fn(),
}));

type Appointment = InferSelectModel<typeof serviceAppointments>;

const advisorId = '22222222-2222-4222-8222-222222222222';
const adviseeId = '11111111-1111-4111-8111-111111111111';
const bookingId = '44444444-4444-4444-8444-444444444444';
const roomId = '66666666-6666-4666-8666-666666666666';

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  const at = new Date('2026-10-20T03:00:00.000Z');
  return {
    id: bookingId,
    serviceId: '33333333-3333-4333-8333-333333333333',
    packageId: null,
    advisorId,
    adviseeId,
    type: 'CONSULTATION',
    startTime: new Date('2026-10-27T03:00:00.000Z'),
    endTime: new Date('2026-10-27T04:00:00.000Z'),
    unavailableUntil: new Date('2026-10-27T04:15:00.000Z'),
    blocksAvailability: true,
    cancelledByUserId: null,
    cancelledAt: null,
    chatRoomId: null,
    jitsiRoomName: null,
    state: 'PENDING_PAYMENT',
    createdAt: at,
    modifiedAt: at,
    ...overrides,
  };
}

/**
 * The scheduling writes are one transaction each. These cases pin that the room
 * is opened on that same transaction handle, so the booking and its room commit
 * or roll back together; the room's own writes are `booking-chat-room.spec.ts`.
 */
describe('BookingsRepository chat rooms', () => {
  const openRoom = jest.mocked(openBookingChatRoom);
  let inserted: Appointment;
  let tx: {
    execute: jest.Mock;
    insert: jest.Mock;
    select: jest.Mock;
    update: jest.Mock;
  };
  let repository: BookingsRepository;

  beforeEach(() => {
    openRoom.mockReset();
    inserted = appointment();
    tx = {
      execute: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn(() => ({
        values: () => ({ returning: () => Promise.resolve([inserted]) }),
      })),
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([appointment({ chatRoomId: roomId })]),
          }),
        }),
      })),
      update: jest.fn(() => ({
        set: () => ({ where: () => Promise.resolve(undefined) }),
      })),
    };
    const db = {
      transaction: jest.fn((run: (handle: typeof tx) => Promise<unknown>) =>
        run(tx),
      ),
    };
    repository = new BookingsRepository(db as unknown as DrizzleDB);
  });

  it('opens the new booking room inside the booking transaction', async () => {
    const withRoom = appointment({ chatRoomId: roomId });
    openRoom.mockResolvedValue(withRoom);

    const created = await repository.createWithSchedulingLock(advisorId, () =>
      Promise.resolve({
        serviceId: inserted.serviceId,
        advisorId,
        adviseeId,
        startTime: inserted.startTime,
        endTime: inserted.endTime,
        unavailableUntil: inserted.unavailableUntil,
      }),
    );

    expect(openRoom).toHaveBeenCalledTimes(1);
    expect(openRoom).toHaveBeenCalledWith(tx, inserted);
    expect(created).toBe(withRoom);
  });

  it('does not open a room when the slot is refused', async () => {
    await expect(
      repository.createWithSchedulingLock(advisorId, () =>
        Promise.reject(new Error('Timeslot is not available')),
      ),
    ).rejects.toThrow('Timeslot is not available');

    expect(openRoom).not.toHaveBeenCalled();
  });

  it('gives a rescheduled replacement its room on the same transaction', async () => {
    inserted = appointment({
      id: '55555555-5555-4555-8555-555555555555',
      chatRoomId: roomId,
    });
    openRoom.mockImplementation((_tx, replacement) =>
      Promise.resolve(replacement),
    );

    const replacement = await repository.rescheduleWithSchedulingLock(
      advisorId,
      bookingId,
      ['PENDING_PAYMENT', 'BOOKED'],
      { state: 'CANCELLED' },
      (original) =>
        Promise.resolve({
          serviceId: original.serviceId,
          advisorId,
          adviseeId,
          startTime: original.startTime,
          endTime: original.endTime,
          unavailableUntil: original.unavailableUntil,
          chatRoomId: original.chatRoomId,
        }),
    );

    expect(openRoom).toHaveBeenCalledWith(tx, inserted);
    expect(replacement?.chatRoomId).toBe(roomId);
  });
});
