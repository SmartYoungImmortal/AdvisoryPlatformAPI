import { eq, type InferSelectModel } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import { chatMembers, chatRooms, serviceAppointments } from '@/database/schema';

type Appointment = InferSelectModel<typeof serviceAppointments>;

/** The transaction a booking is written in; the room is opened on the same one. */
export type BookingTransaction = Parameters<
  Parameters<DrizzleDB['transaction']>[0]
>[0];

/**
 * Opens the chat room a booking comes with, linked the way `seed.ts` links one: a
 * `chat_rooms` row stamped with the booking's own `createdAt`, the Advisee and the
 * Advisor as its two `chat_members`, and the room's id written back to
 * `service_appointments.chat_room_id`.
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

  const [room] = await tx
    .insert(chatRooms)
    .values({ createdAt: appointment.createdAt })
    .returning({ id: chatRooms.id });
  await tx.insert(chatMembers).values([
    { chatRoomId: room.id, memberUserId: appointment.adviseeId },
    { chatRoomId: room.id, memberUserId: appointment.advisorId },
  ]);
  const [linked] = await tx
    .update(serviceAppointments)
    .set({ chatRoomId: room.id })
    .where(eq(serviceAppointments.id, appointment.id))
    .returning();
  return linked ?? { ...appointment, chatRoomId: room.id };
}
