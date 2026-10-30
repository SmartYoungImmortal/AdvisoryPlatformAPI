import { and, asc, eq, isNotNull, type InferSelectModel } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import { chatMembers, chatRooms, serviceAppointments } from '@/database/schema';

type Appointment = InferSelectModel<typeof serviceAppointments>;

/** The transaction a booking is written in; the room is opened on the same one. */
export type BookingTransaction = Parameters<
  Parameters<DrizzleDB['transaction']>[0]
>[0];

/**
 * Gives a booking its chat room, linked the way `seed.ts` links one: the room's id
 * written back to `service_appointments.chat_room_id`.
 *
 * One conversation per Advisee, Advisor and Service. A further booking of the same
 * Service (another time, another package) joins the room the pair's earliest
 * booking of it opened; only a Service they have not booked before opens a new
 * room: a `chat_rooms` row stamped with the booking's own `createdAt`, the Advisee
 * and the Advisor as its two `chat_members`. Both callers hold the per-Advisor
 * scheduling lock, so two bookings of one Service cannot each open a room.
 *
 * Runs on the booking's own transaction, so a booking never commits without its
 * room and a booking the slot refused never leaves an empty room behind.
 *
 * Idempotent. The booking row is read again under a row lock first, and one that
 * already names a room (a replacement that inherited its original's, or a second
 * call for the same booking) is returned with that room rather than given another.
 */
export async function openBookingChatRoom(
  tx: BookingTransaction,
  appointment: Appointment,
): Promise<Appointment> {
  const [current] = await tx
    .select({ chatRoomId: serviceAppointments.chatRoomId })
    .from(serviceAppointments)
    .where(eq(serviceAppointments.id, appointment.id))
    .limit(1)
    .for('update');

  if (!current) return appointment;
  if (current.chatRoomId) {
    return { ...appointment, chatRoomId: current.chatRoomId };
  }

  const chatRoomId =
    (await findServiceRoom(tx, appointment)) ??
    (await openRoom(tx, appointment));
  const [linked] = await tx
    .update(serviceAppointments)
    .set({ chatRoomId })
    .where(eq(serviceAppointments.id, appointment.id))
    .returning();
  return linked ?? { ...appointment, chatRoomId };
}

/** The room the pair's earliest booking of this Service has, if any of them has one. */
async function findServiceRoom(
  tx: BookingTransaction,
  appointment: Appointment,
): Promise<string | undefined> {
  const [earlier] = await tx
    .select({ chatRoomId: serviceAppointments.chatRoomId })
    .from(serviceAppointments)
    .where(
      and(
        eq(serviceAppointments.adviseeId, appointment.adviseeId),
        eq(serviceAppointments.advisorId, appointment.advisorId),
        eq(serviceAppointments.serviceId, appointment.serviceId),
        isNotNull(serviceAppointments.chatRoomId),
      ),
    )
    .orderBy(asc(serviceAppointments.createdAt))
    .limit(1);
  return earlier?.chatRoomId ?? undefined;
}

async function openRoom(
  tx: BookingTransaction,
  appointment: Appointment,
): Promise<string> {
  const [room] = await tx
    .insert(chatRooms)
    .values({ createdAt: appointment.createdAt })
    .returning({ id: chatRooms.id });
  await tx.insert(chatMembers).values([
    { chatRoomId: room.id, memberUserId: appointment.adviseeId },
    { chatRoomId: room.id, memberUserId: appointment.advisorId },
  ]);
  return room.id;
}
