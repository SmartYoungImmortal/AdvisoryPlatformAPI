import { and, asc, eq, isNotNull, type InferSelectModel } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import {
  chatMembers,
  chatRooms,
  serviceAppointments,
  trialRequests,
} from '@/database/schema';

type Appointment = InferSelectModel<typeof serviceAppointments>;

/** Who a conversation is between and what it is about, and when the first write for it happened. */
export interface ServiceRoomParties {
  readonly adviseeId: string;
  readonly advisorId: string;
  readonly serviceId: string;
  readonly createdAt: Date;
}

/** The transaction a booking is written in; the room is opened on the same one. */
export type BookingTransaction = Parameters<
  Parameters<DrizzleDB['transaction']>[0]
>[0];

/**
 * Gives a booking its chat room, linked the way `seed.ts` links one: the room's id
 * written back to `service_appointments.chat_room_id`.
 *
 * One conversation per Advisee, Advisor and Service (`openServiceChatRoom`). A
 * further booking of the same Service (another time, another package) joins the
 * room the pair already has for it, opened by an earlier booking or by a free-trial
 * request. Both callers hold the per-Advisor scheduling lock, so two bookings of
 * one Service cannot each open a room.
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

  const chatRoomId = await openServiceChatRoom(tx, appointment);
  const [linked] = await tx
    .update(serviceAppointments)
    .set({ chatRoomId })
    .where(eq(serviceAppointments.id, appointment.id))
    .returning();
  return linked ?? { ...appointment, chatRoomId };
}

/**
 * The pair's room for the Service: the one an earlier booking or a free-trial
 * request opened, or else a new `chat_rooms` row stamped with `createdAt`, with
 * the Advisee and the Advisor as its two `chat_members`.
 *
 * The caller holds the per-Advisor scheduling lock on `tx`
 * (`lockAdvisorSchedule`), so a booking and a trial request for the same Service
 * cannot each open a room.
 */
export async function openServiceChatRoom(
  tx: BookingTransaction,
  parties: ServiceRoomParties,
): Promise<string> {
  return (
    (await findBookedRoom(tx, parties)) ??
    (await findTrialRoom(tx, parties)) ??
    (await openRoom(tx, parties))
  );
}

/** The room the pair's earliest booking of this Service has, if any of them has one. */
async function findBookedRoom(
  tx: BookingTransaction,
  appointment: ServiceRoomParties,
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

/** The room the Advisee's free-trial request for this Service opened, if they sent one. */
async function findTrialRoom(
  tx: BookingTransaction,
  { adviseeId, serviceId }: ServiceRoomParties,
): Promise<string | undefined> {
  const [request] = await tx
    .select({ chatRoomId: trialRequests.chatRoomId })
    .from(trialRequests)
    .where(
      and(
        eq(trialRequests.adviseeId, adviseeId),
        eq(trialRequests.serviceId, serviceId),
      ),
    )
    .orderBy(asc(trialRequests.createdAt))
    .limit(1);
  return request?.chatRoomId;
}

async function openRoom(
  tx: BookingTransaction,
  appointment: ServiceRoomParties,
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
