import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  notifications,
  screeningAnswers,
  screeningRequests,
  serviceScreeningQuestions,
  services,
  user,
} from '@/database/schema';
import { SCREENING_PENDING_STATUS } from './screening.constants';
import type {
  AdvisorScreeningRequestRow,
  ScreeningAnswerInput,
  ScreeningAnswerRow,
  ScreeningNotification,
  ScreeningQuestion,
  ScreeningQuestionInput,
  ScreeningRequest,
  ScreeningService,
  ScreeningStatus,
} from './screening.types';

@Injectable()
export class ScreeningRepository extends EntityRepository<
  typeof screeningRequests
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, screeningRequests);
  }

  /* ---------------------------------------------------------------- services */

  /** A Service the given Advisor owns, published or not. */
  async findOwnedService(
    serviceId: string,
    advisorId: string,
  ): Promise<ScreeningService | undefined> {
    const [service] = await this.serviceSelect()
      .where(and(eq(services.id, serviceId), eq(services.advisorId, advisorId)))
      .limit(1);
    return service;
  }

  /**
   * A Service an Advisee may apply to: published, by an active and unbanned Advisor — the same
   * visibility rule `GET /services/:serviceId` applies.
   */
  async findPublishedService(
    serviceId: string,
  ): Promise<ScreeningService | undefined> {
    const [service] = await this.serviceSelect()
      .innerJoin(user, eq(user.id, services.advisorId))
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.isPublished, true),
          eq(user.status, 'ACTIVE'),
          eq(user.banned, false),
        ),
      )
      .limit(1);
    return service;
  }

  /* --------------------------------------------------------------- questions */

  findActiveQuestions(serviceId: string): Promise<ScreeningQuestion[]> {
    return this.db
      .select()
      .from(serviceScreeningQuestions)
      .where(
        and(
          eq(serviceScreeningQuestions.serviceId, serviceId),
          isNull(serviceScreeningQuestions.deletedAt),
        ),
      )
      .orderBy(asc(serviceScreeningQuestions.displayOrder));
  }

  /**
   * Replaces the whole question list. The old questions are soft-deleted because past answers
   * still reference them, and every acceptance given against the old questions expires — the
   * Advisee has to answer the new ones (decision 6). Pending requests keep their snapshot answers.
   */
  replaceQuestions(
    serviceId: string,
    questions: ScreeningQuestionInput[],
  ): Promise<ScreeningQuestion[]> {
    return this.db.transaction(async (tx) => {
      const now = new Date();
      await tx
        .update(serviceScreeningQuestions)
        .set({ deletedAt: now })
        .where(
          and(
            eq(serviceScreeningQuestions.serviceId, serviceId),
            isNull(serviceScreeningQuestions.deletedAt),
          ),
        );

      const created = await tx
        .insert(serviceScreeningQuestions)
        .values(
          questions.map((question, index) => ({
            serviceId,
            question: question.question,
            isRequired: question.isRequired,
            displayOrder: index,
          })),
        )
        .returning();

      await tx
        .update(screeningRequests)
        .set({ status: 'EXPIRED' })
        .where(
          and(
            eq(screeningRequests.serviceId, serviceId),
            eq(screeningRequests.status, 'ACCEPTED'),
          ),
        );

      return created;
    });
  }

  /* ------------------------------------------------------- advisee requests */

  /** The Advisee's most recent request for a Service, whatever its status. */
  async findLatestForAdvisee(
    serviceId: string,
    adviseeId: string,
  ): Promise<ScreeningRequest | undefined> {
    const [request] = await this.db
      .select()
      .from(screeningRequests)
      .where(
        and(
          eq(screeningRequests.serviceId, serviceId),
          eq(screeningRequests.adviseeId, adviseeId),
        ),
      )
      .orderBy(desc(screeningRequests.createdAt), desc(screeningRequests.id))
      .limit(1);
    return request;
  }

  async findDisplayName(userId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ displayName: user.displayName })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row?.displayName;
  }

  /**
   * Writes the request, its answers and the Advisor's notification together. The partial unique
   * index on pending requests is what stops two simultaneous submissions; the service maps its
   * violation to a 409.
   */
  createWithAnswers(
    values: { serviceId: string; adviseeId: string },
    answers: ScreeningAnswerInput[],
    notification: ScreeningNotification,
  ): Promise<ScreeningRequest> {
    return this.db.transaction(async (tx) => {
      const [request] = await tx
        .insert(screeningRequests)
        .values(values)
        .returning();

      await tx.insert(screeningAnswers).values(
        answers.map((answer) => ({
          screeningRequestId: request.id,
          questionId: answer.questionId,
          questionText: answer.questionText,
          answer: answer.answer,
        })),
      );
      await tx.insert(notifications).values(notification);

      return request;
    });
  }

  /* ------------------------------------------------------- advisor requests */

  /** Newest first, across every Service the Advisor owns. */
  findManyForAdvisor(
    advisorId: string,
    status: ScreeningStatus | undefined,
    options: { limit: number; offset: number },
  ): Promise<AdvisorScreeningRequestRow[]> {
    return this.advisorSelect(this.advisorWhere(advisorId, status))
      .orderBy(desc(screeningRequests.createdAt), desc(screeningRequests.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /** Counted over the same joins the page uses, so the WHERE never names a missing table. */
  async countForAdvisor(
    advisorId: string,
    status?: ScreeningStatus,
  ): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(screeningRequests)
      .innerJoin(services, eq(services.id, screeningRequests.serviceId))
      .innerJoin(user, eq(user.id, screeningRequests.adviseeId))
      .where(this.advisorWhere(advisorId, status));
    return row?.value ?? 0;
  }

  async findOneForAdvisor(
    requestId: string,
    advisorId: string,
  ): Promise<AdvisorScreeningRequestRow | undefined> {
    const [row] = await this.advisorSelect(
      and(
        eq(screeningRequests.id, requestId),
        eq(services.advisorId, advisorId),
      ),
    ).limit(1);
    return row;
  }

  /** Answers in the order the questions were asked, worded as they were when answered. */
  findAnswers(requestId: string): Promise<ScreeningAnswerRow[]> {
    return this.db
      .select({
        questionId: screeningAnswers.questionId,
        questionText: screeningAnswers.questionText,
        answer: screeningAnswers.answer,
      })
      .from(screeningAnswers)
      .innerJoin(
        serviceScreeningQuestions,
        eq(serviceScreeningQuestions.id, screeningAnswers.questionId),
      )
      .where(eq(screeningAnswers.screeningRequestId, requestId))
      .orderBy(asc(serviceScreeningQuestions.displayOrder));
  }

  /** Stamps the first time the Advisor opened the request; later opens change nothing. */
  async markViewed(requestId: string): Promise<Date> {
    const viewedAt = new Date();
    await this.db
      .update(screeningRequests)
      .set({ viewedAt })
      .where(
        and(
          eq(screeningRequests.id, requestId),
          isNull(screeningRequests.viewedAt),
        ),
      );
    return viewedAt;
  }

  /**
   * Applies a decision only while the request is still pending, and notifies the Advisee in the
   * same transaction. `undefined` means another decision got there first.
   */
  decidePending(
    requestId: string,
    values: PgUpdateSetSource<typeof screeningRequests>,
    notification: ScreeningNotification,
  ): Promise<ScreeningRequest | undefined> {
    return this.db.transaction(async (tx) => {
      const [decided] = await tx
        .update(screeningRequests)
        .set(values)
        .where(
          and(
            eq(screeningRequests.id, requestId),
            eq(screeningRequests.status, SCREENING_PENDING_STATUS),
          ),
        )
        .returning();
      if (!decided) {
        return undefined;
      }
      await tx.insert(notifications).values(notification);
      return decided;
    });
  }

  /* ----------------------------------------------------------------- helpers */

  private serviceSelect() {
    return this.db
      .select({
        id: services.id,
        name: services.name,
        advisorId: services.advisorId,
        screeningRequired: services.screeningRequired,
      })
      .from(services)
      .$dynamic();
  }

  private advisorSelect(where: SQL | undefined) {
    return this.db
      .select({
        id: screeningRequests.id,
        serviceId: screeningRequests.serviceId,
        serviceName: services.name,
        adviseeId: screeningRequests.adviseeId,
        adviseeDisplayName: user.displayName,
        status: screeningRequests.status,
        decisionReason: screeningRequests.decisionReason,
        createdAt: screeningRequests.createdAt,
        decidedAt: screeningRequests.decidedAt,
        viewedAt: screeningRequests.viewedAt,
      })
      .from(screeningRequests)
      .innerJoin(services, eq(services.id, screeningRequests.serviceId))
      .innerJoin(user, eq(user.id, screeningRequests.adviseeId))
      .where(where)
      .$dynamic();
  }

  private advisorWhere(advisorId: string, status?: ScreeningStatus): SQL {
    return and(
      eq(services.advisorId, advisorId),
      status ? eq(screeningRequests.status, status) : undefined,
    ) as SQL;
  }
}
