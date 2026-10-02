import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  type InferSelectModel,
  type SQL,
  sql,
} from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  advisorProfiles,
  serviceAppointments,
  serviceReviews,
  services,
  user,
} from '@/database/schema';
import type { ReviewRow } from './dtos/review-response.dto';

type Review = InferSelectModel<typeof serviceReviews>;
type Appointment = InferSelectModel<typeof serviceAppointments>;

/**
 * Not an `EntityRepository` — `service_reviews` is keyed by `appointmentId`, the appointment it
 * belongs to, and has no `id` column for the generic base to work from.
 */
@Injectable()
export class ReviewsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<Review | undefined> {
    const [review] = await this.db
      .select()
      .from(serviceReviews)
      .where(eq(serviceReviews.appointmentId, appointmentId))
      .limit(1);
    return review;
  }

  /**
   * Ownership and existence in one query. A caller who is not this appointment's Advisee gets
   * `undefined` exactly as a caller naming an appointment that does not exist does, so the two
   * are indistinguishable from outside.
   */
  async findAppointmentForAdvisee(
    appointmentId: string,
    adviseeId: string,
  ): Promise<Appointment | undefined> {
    const [appointment] = await this.db
      .select()
      .from(serviceAppointments)
      .where(
        and(
          eq(serviceAppointments.id, appointmentId),
          eq(serviceAppointments.adviseeId, adviseeId),
        ),
      )
      .limit(1);
    return appointment;
  }

  async findAppointmentForAdvisor(
    appointmentId: string,
    advisorId: string,
  ): Promise<Appointment | undefined> {
    const [appointment] = await this.db
      .select()
      .from(serviceAppointments)
      .where(
        and(
          eq(serviceAppointments.id, appointmentId),
          eq(serviceAppointments.advisorId, advisorId),
        ),
      )
      .limit(1);
    return appointment;
  }

  async create(values: {
    appointmentId: string;
    stars: number;
    comment: string | null;
  }): Promise<Review> {
    const [review] = await this.db
      .insert(serviceReviews)
      .values(values)
      .returning();
    return review;
  }

  /**
   * An Advisee rewriting their own review. `advisorReply` is deliberately untouched: the Advisor's
   * words are not the Advisee's to replace, and clearing a reply on every edit would make the two
   * sides race each other.
   */
  async updateRating(
    appointmentId: string,
    values: { stars: number; comment: string | null },
  ): Promise<Review | undefined> {
    const [review] = await this.db
      .update(serviceReviews)
      .set(values)
      .where(eq(serviceReviews.appointmentId, appointmentId))
      .returning();
    return review;
  }

  async setAdvisorReply(
    appointmentId: string,
    advisorReply: string,
  ): Promise<Review | undefined> {
    const [review] = await this.db
      .update(serviceReviews)
      .set({ advisorReply })
      .where(eq(serviceReviews.appointmentId, appointmentId))
      .returning();
    return review;
  }

  async findDetailed(appointmentId: string): Promise<ReviewRow | undefined> {
    const [row] = await this.detailedSelect(
      eq(serviceReviews.appointmentId, appointmentId),
    ).limit(1);
    return row;
  }

  findManyForAdvisor(
    advisorId: string,
    options: { limit: number; offset: number },
  ): Promise<ReviewRow[]> {
    return (
      this.detailedSelect(eq(serviceAppointments.advisorId, advisorId))
        // Newest first: a review list is read as a feed, and the card leads with its date.
        .orderBy(desc(serviceReviews.createdAt))
        .limit(options.limit)
        .offset(options.offset)
    );
  }

  async countForAdvisor(advisorId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(serviceReviews)
      .innerJoin(
        serviceAppointments,
        eq(serviceAppointments.id, serviceReviews.appointmentId),
      )
      .where(eq(serviceAppointments.advisorId, advisorId));
    return row?.value ?? 0;
  }

  /**
   * The five bars on the summary card, counted in the database rather than by paging the whole
   * list into memory. Star values nobody has given simply do not come back; the DTO fills them in
   * as zero.
   */
  async countByStarsForAdvisor(
    advisorId: string,
  ): Promise<ReadonlyMap<number, number>> {
    const rows = await this.db
      .select({ stars: serviceReviews.stars, value: count() })
      .from(serviceReviews)
      .innerJoin(
        serviceAppointments,
        eq(serviceAppointments.id, serviceReviews.appointmentId),
      )
      .where(eq(serviceAppointments.advisorId, advisorId))
      .groupBy(serviceReviews.stars);
    return new Map(rows.map((row) => [row.stars, row.value]));
  }

  /** Whether this advisor is one the public routes may acknowledge at all. */
  async publicAdvisorExists(advisorId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ value: sql<number>`1` })
      .from(advisorProfiles)
      .innerJoin(user, eq(user.id, advisorProfiles.userId))
      .where(
        and(
          eq(advisorProfiles.userId, advisorId),
          eq(user.status, 'ACTIVE'),
          eq(user.banned, false),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  /**
   * One shape for every review response. The card needs the consultation it came from and who
   * wrote it, so the appointment, its service and the reviewer are joined here rather than
   * fetched per row by the service.
   */
  private detailedSelect(where: SQL) {
    return this.db
      .select({
        appointmentId: serviceReviews.appointmentId,
        stars: serviceReviews.stars,
        comment: serviceReviews.comment,
        advisorReply: serviceReviews.advisorReply,
        createdAt: serviceReviews.createdAt,
        modifiedAt: serviceReviews.modifiedAt,
        appointmentStartTime: serviceAppointments.startTime,
        serviceName: services.name,
        serviceDurationMinutes: services.durationMinutes,
        reviewerDisplayName: user.displayName,
        reviewerAvatarKey: user.avatarKey,
      })
      .from(serviceReviews)
      .innerJoin(
        serviceAppointments,
        eq(serviceAppointments.id, serviceReviews.appointmentId),
      )
      .innerJoin(services, eq(services.id, serviceAppointments.serviceId))
      .innerJoin(user, eq(user.id, serviceAppointments.adviseeId))
      .where(where)
      .$dynamic();
  }
}
