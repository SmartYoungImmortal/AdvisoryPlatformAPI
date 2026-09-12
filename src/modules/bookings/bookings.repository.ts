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
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { serviceAppointments, services } from '@/database/schema';
import type { AppointmentState } from './booking-states';

type Appointment = InferSelectModel<typeof serviceAppointments>;
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

  async findPublishedService(serviceId: string) {
    const [service] = await this.db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.isPublished, true)))
      .limit(1);
    return service;
  }

  /**
   * Serializes the eligibility recheck and insert per Advisor. This closes the
   * race for daily limits while the exclusion constraint remains the final
   * guarantee against overlapping appointment ranges.
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
      return appointment;
    });
  }

  /**
   * Cancels the original appointment and claims the replacement under one advisory
   * lock, so a range the cancellation reopens is visible to the rederivation that
   * picks the new slot. `replacementValues` receives the pre-cancellation row because
   * the replacement inherits the state the original had reached. An undefined result
   * means the original was no longer cancellable.
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
      return replacement;
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

  async findManyForAdvisor(
    advisorId: string,
    options: { limit: number; offset: number },
  ): Promise<Appointment[]> {
    return this.findManyByParticipant(
      eq(serviceAppointments.advisorId, advisorId),
      options,
    );
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
