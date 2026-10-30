import type { InferSelectModel } from 'drizzle-orm';
import { chatMembers, chatRooms, serviceAppointments } from '@/database/schema';
import {
  openBookingChatRoom,
  type BookingTransaction,
} from './booking-chat-room';

type Appointment = InferSelectModel<typeof serviceAppointments>;

const bookingId = '44444444-4444-4444-8444-444444444444';
const adviseeId = '11111111-1111-4111-8111-111111111111';
const advisorId = '22222222-2222-4222-8222-222222222222';
const roomId = '66666666-6666-4666-8666-666666666666';
const createdAt = new Date('2026-10-20T03:04:05.678Z');

function appointment(overrides: Partial<Appointment> = {}): Appointment {
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
    createdAt,
    modifiedAt: createdAt,
    ...overrides,
  };
}

type Write = {
  readonly op: 'insert' | 'update';
  readonly table: unknown;
  readonly values: unknown;
};

/**
 * Stands in for the booking's transaction: answers the locked re-read with
 * `lockedRow` and the look for the pair's earlier room of the Service with
 * `serviceRoom`, hands out `roomId` for a new room, and records every write in order.
 */
function fakeTransaction(
  lockedRow: { chatRoomId: string | null } | undefined,
  serviceRoom?: string,
) {
  const writes: Write[] = [];
  const locks: string[] = [];
  const tx = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => ({
            for: (strength: string) => {
              locks.push(strength);
              return Promise.resolve(lockedRow ? [lockedRow] : []);
            },
          }),
          orderBy: () => ({
            limit: () =>
              Promise.resolve(serviceRoom ? [{ chatRoomId: serviceRoom }] : []),
          }),
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        writes.push({ op: 'insert', table, values });
        return Object.assign(Promise.resolve([]), {
          returning: () => Promise.resolve([{ id: roomId }]),
        });
      },
    }),
    update: (table: unknown) => ({
      set: (values: Partial<Appointment>) => ({
        where: () => ({
          returning: () => {
            writes.push({ op: 'update', table, values });
            return Promise.resolve([appointment(values)]);
          },
        }),
      }),
    }),
  };
  return { tx: tx as unknown as BookingTransaction, writes, locks };
}

describe('openBookingChatRoom', () => {
  it('opens a room at the booking instant with both parties as members, and links it', async () => {
    const { tx, writes, locks } = fakeTransaction({ chatRoomId: null });

    const linked = await openBookingChatRoom(tx, appointment());

    expect(linked.chatRoomId).toBe(roomId);
    expect(locks).toEqual(['update']);
    expect(writes).toEqual([
      { op: 'insert', table: chatRooms, values: { createdAt } },
      {
        op: 'insert',
        table: chatMembers,
        values: [
          { chatRoomId: roomId, memberUserId: adviseeId },
          { chatRoomId: roomId, memberUserId: advisorId },
        ],
      },
      {
        op: 'update',
        table: serviceAppointments,
        values: { chatRoomId: roomId },
      },
    ]);
  });

  it('joins the room of the pair’s earlier booking of the same Service', async () => {
    const earlier = '88888888-8888-4888-8888-888888888888';
    const { tx, writes } = fakeTransaction({ chatRoomId: null }, earlier);

    const linked = await openBookingChatRoom(tx, appointment());

    expect(linked.chatRoomId).toBe(earlier);
    expect(writes).toEqual([
      {
        op: 'update',
        table: serviceAppointments,
        values: { chatRoomId: earlier },
      },
    ]);
  });

  it('keeps the room a booking already has instead of opening a second one', async () => {
    const existing = '77777777-7777-4777-8777-777777777777';
    const { tx, writes } = fakeTransaction({ chatRoomId: existing });

    const linked = await openBookingChatRoom(tx, appointment());

    expect(linked.chatRoomId).toBe(existing);
    expect(writes).toEqual([]);
  });

  it('is idempotent across repeated calls for the same booking', async () => {
    const first = fakeTransaction({ chatRoomId: null });
    const opened = await openBookingChatRoom(first.tx, appointment());

    const second = fakeTransaction({ chatRoomId: opened.chatRoomId });
    const again = await openBookingChatRoom(second.tx, opened);

    expect(again.chatRoomId).toBe(opened.chatRoomId);
    expect(first.writes).toHaveLength(3);
    expect(second.writes).toEqual([]);
  });

  it('writes nothing for a booking the transaction cannot see', async () => {
    const { tx, writes } = fakeTransaction(undefined);
    const booking = appointment();

    await expect(openBookingChatRoom(tx, booking)).resolves.toBe(booking);
    expect(writes).toEqual([]);
  });
});
