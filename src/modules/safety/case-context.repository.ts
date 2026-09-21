import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  chatMessages,
  serviceAppointments,
  serviceInvoices,
  services,
  user,
} from '@/database/schema';
import type { CaseAppointmentRow, CaseMessageRow } from './safety.types';

/** Enough of a conversation to judge a case by; a real room is far shorter. */
export const CASE_CONVERSATION_LIMIT = 200;

/**
 * What a moderator needs beside a report or a flag to rule on it: the conversation
 * it came from and the consultation that conversation belongs to.
 *
 * Read-only and admin-only — the controllers that use it sit behind the `report:read`
 * and `offPlatformFlag:read` permissions. A chat transcript is private between two
 * people; the only reason it leaves the room is that one of them reported the other,
 * or the detector flagged a line in it, and ruling on that is exactly this.
 */
@Injectable()
export class CaseContextRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** The room's messages, oldest first, each with its sender's names. */
  conversation(chatRoomId: string): Promise<CaseMessageRow[]> {
    return this.db
      .select({
        id: chatMessages.id,
        senderUserId: chatMessages.senderUserId,
        senderDisplayName: user.displayName,
        senderFullName: user.fullName,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .innerJoin(user, eq(user.id, chatMessages.senderUserId))
      .where(eq(chatMessages.chatRoomId, chatRoomId))
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id))
      .limit(CASE_CONVERSATION_LIMIT);
  }

  /** One message, for a flag: which room it was said in and by whom. */
  async message(
    messageId: string,
  ): Promise<(CaseMessageRow & { chatRoomId: string }) | undefined> {
    const [row] = await this.db
      .select({
        id: chatMessages.id,
        chatRoomId: chatMessages.chatRoomId,
        senderUserId: chatMessages.senderUserId,
        senderDisplayName: user.displayName,
        senderFullName: user.fullName,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .innerJoin(user, eq(user.id, chatMessages.senderUserId))
      .where(eq(chatMessages.id, messageId))
      .limit(1);
    return row;
  }

  /**
   * The consultation the room belongs to, with its invoice. A room serves one
   * booking today; the latest is taken should that ever stop being true.
   */
  async appointmentForRoom(
    chatRoomId: string,
  ): Promise<CaseAppointmentRow | undefined> {
    const [row] = await this.db
      .select({
        id: serviceAppointments.id,
        serviceId: serviceAppointments.serviceId,
        serviceName: services.name,
        advisorId: serviceAppointments.advisorId,
        adviseeId: serviceAppointments.adviseeId,
        type: serviceAppointments.type,
        state: serviceAppointments.state,
        startTime: serviceAppointments.startTime,
        endTime: serviceAppointments.endTime,
        cancelledAt: serviceAppointments.cancelledAt,
        cancelledByUserId: serviceAppointments.cancelledByUserId,
        jitsiRoomName: serviceAppointments.jitsiRoomName,
        invoiceAmountSatang: serviceInvoices.amountSatang,
        invoiceStatus: serviceInvoices.status,
      })
      .from(serviceAppointments)
      .innerJoin(services, eq(services.id, serviceAppointments.serviceId))
      .leftJoin(
        serviceInvoices,
        eq(serviceInvoices.appointmentId, serviceAppointments.id),
      )
      .where(eq(serviceAppointments.chatRoomId, chatRoomId))
      .orderBy(desc(serviceAppointments.startTime))
      .limit(1);
    return row;
  }
}
