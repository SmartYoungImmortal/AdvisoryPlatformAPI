import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  eq,
  inArray,
  type InferInsertModel,
  type InferSelectModel,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { isVerifiedAdvisor } from '@/common/authorization/verified-advisor.predicate';
import { serviceName } from '@/common/i18n/localized-columns';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { serviceAppointments, services, user } from '@/database/schema';
import { openBookingChatRoom } from '@/modules/chat/booking-chat-room';
import type { AppointmentState } from './booking-states';

type Appointment = InferSelectModel<typeof serviceAppointments>;
/** A booking as the Advisor's own list returns it. */
export type AdvisorAppointment = Appointment & {
  adviseeName: string;
  serviceName: string;
};
type NewAppointment = InferInsertModel<typeof serviceAppointments>;
type AppointmentUpdate = PgUpdateSetSource<typeof serviceAppointments>;
type Transaction = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class BookingsRepository extends EntityRepository<
  typeof serviceAppointments
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, serviceAppointments);
  }

  /** A Service an Advisee may book: published, by an Advisor an admin has verified. */
  async findPublishedService(serviceId: string) {
    const [service] = await this.db
      .select()
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
   * Serializes the eligibility recheck and insert per Advisor. This closes the
   * race for daily limits while the exclusion constraint remains the final
   * guarantee against overlapping appointment ranges.
   *
   * The booking's chat room is opened in the same transaction, so the two commit
   * or roll back together; see `openBookingChatRoom`.
   */
  createWithSchedulingLock(
    advisorId: string,
    eligibleValues: () => Promise<NewAppointment>,
  ): Promise<Appointment> {
    return this.db.transaction(async (tx) => {
      await lockAdvisorSchedule(tx, advisorId);
      const values = await eligibleValues();
      const [appointment] = await tx
        .insert(serviceAppointments)
        .values(values)
        .returning();
      return openBookingChatRoom(tx, appointment);
    });
  }

  /**
   * Cancels the original appointment and claims the replacement under one advisory
   * lock, so a range the cancellation reopens is visible to the rederivation that
   * picks the new slot. `replacementValues` receives the pre-cancellation row because
   * the replacement inherits the state the original had reached. An undefined result
   * means the original was no longer cancellable.
   *
   * The replacement keeps the conversation: it carries the original's room when
   * `replacementValues` passes `chatRoomId` on, and is given one only when the
   * original had none.
   */
  rescheduleWithSchedulingLock(
    advisorId: string,
    bookingId: string,
    acceptedStates: readonly AppointmentState[],
    cancellation: AppointmentUpdate,
    replacementValues: (original: Appointment) => Promise<NewAppointment>,
  ): Promise<Appointment | undefined> {
    return this.db.transaction(async (tx) => {
      await lockAdvisorSchedule(tx, advisorId);
      const [original] = await tx
        .select()
        .from(serviceAppointments)
        .where(transitionWhere(bookingId, acceptedStates))
        .limit(1);
      if (!original) return undefined;
      await tx
        .update(serviceAppointments)
        .set(cancellation)
        .where(eq(serviceAppointments.id, bookingId));
      const [replacement] = await tx
        .insert(serviceAppointments)
        .values(await replacementValues(original))
        .returning();
      return openBookingChatRoom(tx, replacement);
    });
  }

  /**
   * Applies a state change only while the row is still in one of the states the
   * transition accepts. An undefined result means a concurrent caller moved it first.
   */
  async transition(
    bookingId: string,
    acceptedStates: readonly AppointmentState[],
    values: AppointmentUpdate,
  ): Promise<Appointment | undefined> {
    const [appointment] = await this.updateWhere(
      transitionWhere(bookingId, acceptedStates),
      values,
    );
    return appointment;
  }

  findForParticipant(
    bookingId: string,
    userId: string,
  ): Promise<Appointment | undefined> {
    return this.findOne(
      and(
        eq(serviceAppointments.id, bookingId),
        or(
          eq(serviceAppointments.adviseeId, userId),
          eq(serviceAppointments.advisorId, userId),
        ),
      ) as SQL,
    );
  }

  findForAdvisee(
    bookingId: string,
    adviseeId: string,
  ): Promise<Appointment | undefined> {
    return this.findOne(
      and(
        eq(serviceAppointments.id, bookingId),
        eq(serviceAppointments.adviseeId, adviseeId),
      ) as SQL,
    );
  }

  findForAdvisor(
    bookingId: string,
    advisorId: string,
  ): Promise<Appointment | undefined> {
    return this.findOne(
      and(
        eq(serviceAppointments.id, bookingId),
        eq(serviceAppointments.advisorId, advisorId),
      ) as SQL,
    );
  }

  async findManyForAdvisee(
    adviseeId: string,
    options: { limit: number; offset: number },
  ): Promise<Appointment[]> {
    return this.findManyByParticipant(
      eq(serviceAppointments.adviseeId, adviseeId),
      options,
    );
  }

  async countForAdvisee(adviseeId: string): Promise<number> {
    return this.countByParticipant(
      eq(serviceAppointments.adviseeId, adviseeId),
    );
  }

  /**
   * The Advisor's bookings with who booked and what, because the Advisor's desk
   * has to say both and the Advisor cannot read another user's profile or a
   * service by id on its own. Only the Advisee's public display name is read.
   */
  async findManyForAdvisor(
    advisorId: string,
    options: { limit: number; offset: number },
  ): Promise<AdvisorAppointment[]> {
    const rows = await this.db
      .select({
        appointment: serviceAppointments,
        adviseeName: user.displayName,
        serviceName: serviceName(),
      })
      .from(serviceAppointments)
      .innerJoin(user, eq(user.id, serviceAppointments.adviseeId))
      .innerJoin(services, eq(services.id, serviceAppointments.serviceId))
      .where(eq(serviceAppointments.advisorId, advisorId))
      .orderBy(serviceAppointments.startTime)
      .limit(options.limit)
      .offset(options.offset);
    return rows.map((row) => ({
      ...row.appointment,
      adviseeName: row.adviseeName,
      serviceName: row.serviceName,
    }));
  }

  async countForAdvisor(advisorId: string): Promise<number> {
    return this.countByParticipant(
      eq(serviceAppointments.advisorId, advisorId),
    );
  }

  private findManyByParticipant(
    where: SQL,
    options: { limit: number; offset: number },
  ): Promise<Appointment[]> {
    return this.db
      .select()
      .from(serviceAppointments)
      .where(where)
      .orderBy(serviceAppointments.startTime)
      .limit(options.limit)
      .offset(options.offset);
  }

  private countByParticipant(where: SQL): Promise<number> {
    return this.count(where);
  }
}

function transitionWhere(
  bookingId: string,
  acceptedStates: readonly AppointmentState[],
): SQL {
  return and(
    eq(serviceAppointments.id, bookingId),
    inArray(serviceAppointments.state, [...acceptedStates]),
  ) as SQL;
}

function lockAdvisorSchedule(
  tx: Transaction,
  advisorId: string,
): Promise<unknown> {
  return tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${advisorId}, 0))`,
  );
}
