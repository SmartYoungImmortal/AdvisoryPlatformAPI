import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { isVerifiedAdvisor } from '@/common/authorization/verified-advisor.predicate';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { escapeLike } from '@/common/utils/escape-like';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  availabilityProfiles,
  serviceCategories,
  serviceImages,
  services,
  user,
} from '@/database/schema';
import type { PublicServiceDocument } from './advisor-services.types';
import type { PublicServiceQueryDto } from './dtos/public-service-query.dto';

type AdvisorService = InferSelectModel<typeof services>;
@Injectable()
export class AdvisorServicesRepository extends EntityRepository<
  typeof services
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, services);
  }

  async findManyByAdvisorId(
    advisorId: string,
    options: { limit: number; offset: number },
  ): Promise<AdvisorService[]> {
    return await this.db
      .select()
      .from(services)
      .where(eq(services.advisorId, advisorId))
      .orderBy(services.createdAt)
      .limit(options.limit)
      .offset(options.offset);
  }

  async countByAdvisorId(advisorId: string): Promise<number> {
    return this.count(eq(services.advisorId, advisorId));
  }

  async findOwnedById(
    advisorId: string,
    serviceId: string,
  ): Promise<AdvisorService | undefined> {
    return this.findOne(this.ownedWhere(advisorId, serviceId));
  }

  async categoryExists(categoryId: string): Promise<boolean> {
    const [category] = await this.db
      .select({ id: serviceCategories.id })
      .from(serviceCategories)
      .where(eq(serviceCategories.id, categoryId))
      .limit(1);
    return category !== undefined;
  }

  async availabilityProfileOwned(
    advisorId: string,
    profileId: string,
  ): Promise<boolean> {
    const [profile] = await this.db
      .select({ id: availabilityProfiles.id })
      .from(availabilityProfiles)
      .where(
        and(
          eq(availabilityProfiles.id, profileId),
          eq(availabilityProfiles.advisorId, advisorId),
          isNull(availabilityProfiles.deletedAt),
        ),
      )
      .limit(1);
    return profile !== undefined;
  }

  async updateOwned(
    advisorId: string,
    serviceId: string,
    values: PgUpdateSetSource<typeof services>,
  ): Promise<AdvisorService | undefined> {
    const [service] = await this.updateWhere(
      this.ownedWhere(advisorId, serviceId),
      values,
    );
    return service;
  }

  /**
   * The service and its photographs, in one transaction.
   *
   * `service_images` references the service with no cascade, so deleting the
   * row alone fails as soon as it has photographs, which every seeded service
   * now does. The photographs go only once the same `ownedWhere` has found the
   * service, so another advisor's id deletes nothing, and a service that still
   * cannot go (it has bookings) keeps its photographs when the delete rolls back.
   */
  async deleteOwned(
    advisorId: string,
    serviceId: string,
  ): Promise<AdvisorService | undefined> {
    return this.db.transaction(async (tx) => {
      const [owned] = await tx
        .select({ id: services.id })
        .from(services)
        .where(this.ownedWhere(advisorId, serviceId));
      if (!owned) return undefined;

      await tx
        .delete(serviceImages)
        .where(eq(serviceImages.serviceId, serviceId));
      const [service] = await tx
        .delete(services)
        .where(this.ownedWhere(advisorId, serviceId))
        .returning();
      return service;
    });
  }

  async findPublished(
    query: PublicServiceQueryDto,
    options: { limit: number; offset: number },
  ): Promise<PublicServiceDocument[]> {
    return await this.selectPublished(query)
      .orderBy(asc(services.createdAt), asc(services.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same join `selectPublished` uses, not through the inherited
   * `count()`.
   *
   * `publishedWhere` filters on `user.status` and `user.banned` as well as on the
   * service, and the inherited `count()` selects `from(services)` alone. That made
   * every call emit `select count(*) from "services" where ... "user"."status" ...`
   * with no `user` in the FROM clause, which Postgres rejects outright — so
   * `GET /api/v1/services` answered 500 for every request, while
   * `GET /api/v1/services/:id` worked because it goes through `selectPublished`.
   * A suspended advisor's services have to disappear from the count as well as
   * from the page, or the last page of results is empty.
   */
  async countPublished(query: PublicServiceQueryDto): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(services)
      .innerJoin(user, eq(user.id, services.advisorId))
      .where(this.publishedWhere(query));
    return row?.value ?? 0;
  }

  async findPublishedById(
    serviceId: string,
  ): Promise<PublicServiceDocument | undefined> {
    const [service] = await this.selectPublished(
      undefined,
      eq(services.id, serviceId),
    );
    return service;
  }

  /**
   * The photograph keys for a set of services, in one query rather than one per
   * row: a flat list for the caller to group, each service's keys in carousel
   * order.
   */
  async findImageKeysFor(
    serviceIds: readonly string[],
  ): Promise<{ serviceId: string; objectKey: string }[]> {
    if (serviceIds.length === 0) return [];
    return this.db
      .select({
        serviceId: serviceImages.serviceId,
        objectKey: serviceImages.objectKey,
      })
      .from(serviceImages)
      .where(inArray(serviceImages.serviceId, [...serviceIds]))
      .orderBy(asc(serviceImages.serviceId), asc(serviceImages.carouselIndex));
  }

  private ownedWhere(advisorId: string, serviceId: string): SQL {
    return and(
      eq(services.id, serviceId),
      eq(services.advisorId, advisorId),
    ) as SQL;
  }

  private selectPublished(query?: PublicServiceQueryDto, extraPredicate?: SQL) {
    return this.db
      .select({
        id: services.id,
        advisorId: services.advisorId,
        categoryId: services.categoryId,
        name: services.name,
        description: services.description,
        priceSatang: services.priceSatang,
        durationMinutes: services.durationMinutes,
        screeningRequired: services.screeningRequired,
        trialEnabled: services.trialEnabled,
        trialDurationMinutes: services.trialDurationMinutes,
        createdAt: services.createdAt,
      })
      .from(services)
      .innerJoin(user, eq(user.id, services.advisorId))
      .where(and(this.publishedWhere(query), extraPredicate));
  }

  private publishedWhere(query?: PublicServiceQueryDto): SQL {
    const text = query?.q?.trim();
    const textPredicate = text
      ? or(
          ilike(services.name, `%${escapeLike(text)}%`),
          ilike(services.description, `%${escapeLike(text)}%`),
        )
      : undefined;

    return and(
      eq(services.isPublished, true),
      eq(user.status, 'ACTIVE'),
      eq(user.banned, false),
      isVerifiedAdvisor(services.advisorId),
      query?.categoryId ? eq(services.categoryId, query.categoryId) : undefined,
      query?.advisorId ? eq(services.advisorId, query.advisorId) : undefined,
      query?.minPriceSatang !== undefined
        ? gte(services.priceSatang, query.minPriceSatang)
        : undefined,
      query?.maxPriceSatang !== undefined
        ? lte(services.priceSatang, query.maxPriceSatang)
        : undefined,
      textPredicate,
    ) as SQL;
  }
}
