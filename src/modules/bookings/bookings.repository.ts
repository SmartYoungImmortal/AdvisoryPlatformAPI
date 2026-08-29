import { Inject, Injectable } from '@nestjs/common';
import { and, eq, type InferSelectModel, type SQL } from 'drizzle-orm';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  screeningRequests,
  serviceAppointments,
  services,
} from '@/database/schema';

type Appointment = InferSelectModel<typeof serviceAppointments>;

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

  async hasAcceptedScreening(
    serviceId: string,
    adviseeId: string,
  ): Promise<boolean> {
    const [request] = await this.db
      .select({ id: screeningRequests.id })
      .from(screeningRequests)
      .where(
        and(
          eq(screeningRequests.serviceId, serviceId),
          eq(screeningRequests.adviseeId, adviseeId),
          eq(screeningRequests.status, 'ACCEPTED'),
        ),
      )
      .limit(1);
    return request !== undefined;
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
