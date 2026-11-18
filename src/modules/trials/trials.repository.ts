import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, getColumns, sql, type SQL } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { isVerifiedAdvisor } from '@/common/authorization/verified-advisor.predicate';
import { serviceName } from '@/common/i18n/localized-columns';
import { runWithLocale } from '@/common/i18n/request-locale';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  chatMembers,
  serviceAppointments,
  services,
  trialRequests,
  user,
  type ContentLocale,
} from '@/database/schema';
import { lockAdvisorSchedule } from '@/modules/bookings/bookings.repository';
import { openServiceChatRoom } from '@/modules/chat/booking-chat-room';
import { liveTrialBooking } from './trial-bookings';
import type {
  TrialRequest,
  TrialRequestRow,
  TrialService,
} from './trials.types';

@Injectable()
export class TrialsRepository extends EntityRepository<typeof trialRequests> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, trialRequests);
  }

  /* ---------------------------------------------------------------- services */

  /**
   * A Service an Advisee can ask a trial of: published, by a verified Advisor. This is the rule
   * booking uses, because a granted trial ends in a booking.
   */
  async findPublishedService(
    serviceId: string,
  ): Promise<TrialService | undefined> {
    const [service] = await this.db
      .select({
        id: services.id,
        name: serviceName(),
        advisorId: services.advisorId,
        trialEnabled: services.trialEnabled,
        trialDurationMinutes: services.trialDurationMinutes,
      })
      .from(services)
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.isPublished, true),
          isVerifiedAdvisor(services.advisorId),
        ),
      )
      .limit(1);
    return service;
  }

  /**
   * A Service's name in each language, for a notification that is written in all of them at once
   * whatever language the request that sends it is in.
   */
  async findServiceNames(
    serviceId: string,
  ): Promise<Record<ContentLocale, string> | undefined> {
    const [names] = await this.db
      .select({
        th: runWithLocale('th', serviceName),
        en: runWithLocale('en', serviceName),
      })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);
    return names;
  }

  async findDisplayName(userId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ displayName: user.displayName })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row?.displayName;
  }

  /* ---------------------------------------------------------------- requests */

  /** The Advisee's request for a Service, if they sent one. There is at most one. */
  async findForAdvisee(
    serviceId: string,
    adviseeId: string,
  ): Promise<TrialRequestRow | undefined> {
    const [row] = await this.rowSelect(
      and(
        eq(trialRequests.serviceId, serviceId),
        eq(trialRequests.adviseeId, adviseeId),
      ),
    ).limit(1);
    return row;
  }

  async isRoomMember(chatRoomId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ chatRoomId: chatMembers.chatRoomId })
      .from(chatMembers)
      .where(
        and(
          eq(chatMembers.chatRoomId, chatRoomId),
          eq(chatMembers.memberUserId, userId),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  /** The requests whose cards are in a chat room, oldest first like the room's messages. */
  findForRoom(chatRoomId: string): Promise<TrialRequestRow[]> {
    return this.rowSelect(eq(trialRequests.chatRoomId, chatRoomId)).orderBy(
      asc(trialRequests.createdAt),
      asc(trialRequests.id),
    );
  }

  async findOneForAdvisor(
    requestId: string,
    advisorId: string,
  ): Promise<TrialRequestRow | undefined> {
    const [row] = await this.rowSelect(
      and(eq(trialRequests.id, requestId), eq(services.advisorId, advisorId)),
    ).limit(1);
    return row;
  }

  /**
   * Saves the request in the chat room the Advisee and the Advisor have for the Service, opening
   * one if they have none, in one transaction. The per-Advisor scheduling lock keeps a booking
   * of the same Service from opening a second room at the same moment. A second ask for the
   * same Service fails on the unique index, which the service turns into a 409.
   */
  createWithRoom(values: {
    serviceId: string;
    adviseeId: string;
    advisorId: string;
  }): Promise<TrialRequest> {
    return this.db.transaction(async (tx) => {
      await lockAdvisorSchedule(tx, values.advisorId);
      const createdAt = new Date();
      const chatRoomId = await openServiceChatRoom(tx, {
        ...values,
        createdAt,
      });
      const [request] = await tx
        .insert(trialRequests)
        .values({
          serviceId: values.serviceId,
          adviseeId: values.adviseeId,
          chatRoomId,
          createdAt,
        })
        .returning();
      return request;
    });
  }

  /** Saves the decision only if the request is still pending; `undefined` if another came first. */
  async decidePending(
    requestId: string,
    values: PgUpdateSetSource<typeof trialRequests>,
  ): Promise<TrialRequest | undefined> {
    const [decided] = await this.db
      .update(trialRequests)
      .set(values)
      .where(
        and(
          eq(trialRequests.id, requestId),
          eq(trialRequests.status, 'PENDING'),
        ),
      )
      .returning();
    return decided;
  }

  /* ----------------------------------------------------------------- helpers */

  private rowSelect(where: SQL | undefined) {
    const trialBooking = this.db
      .select({ id: serviceAppointments.id })
      .from(serviceAppointments)
      .where(liveTrialBooking(trialRequests.serviceId, trialRequests.adviseeId))
      .orderBy(desc(serviceAppointments.createdAt))
      .limit(1);
    return this.db
      .select({
        ...getColumns(trialRequests),
        serviceName: serviceName(),
        advisorId: services.advisorId,
        trialDurationMinutes: services.trialDurationMinutes,
        trialBookingId: sql<string | null>`(${trialBooking})`,
      })
      .from(trialRequests)
      .innerJoin(services, eq(services.id, trialRequests.serviceId))
      .where(where)
      .$dynamic();
  }
}
