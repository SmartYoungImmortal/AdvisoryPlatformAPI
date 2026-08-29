import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  sql,
  type SQL,
} from 'drizzle-orm';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { serviceAppointments, services } from '@/database/schema';

type Appointment = InferSelectModel<typeof serviceAppointments>;
type NewAppointment = InferInsertModel<typeof serviceAppointments>;

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
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${advisorId}, 0))`,
      );
      const values = await eligibleValues();
      const [appointment] = await tx
        .insert(serviceAppointments)
        .values(values)
        .returning();
      return appointment;
    });
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
