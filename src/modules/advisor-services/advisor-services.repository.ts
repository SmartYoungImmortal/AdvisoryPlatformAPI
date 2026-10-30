import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  notInArray,
  or,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { isVerifiedAdvisor } from '@/common/authorization/verified-advisor.predicate';
import {
  saveServiceTranslation,
  writesSourceText,
} from '@/common/i18n/content-translations';
import {
  serviceDescription,
  serviceName,
} from '@/common/i18n/localized-columns';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { escapeLike } from '@/common/utils/escape-like';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  availabilityProfiles,
  serviceCategories,
  serviceImages,
  servicePackages,
  services,
  user,
} from '@/database/schema';
import type { PublicServiceDocument } from './advisor-services.types';
import type {
  ServicePackage,
  ServicePackageInputDto,
} from './dtos/service-package.dto';
import type { PublicServiceQueryDto } from './dtos/public-service-query.dto';

type AdvisorService = InferSelectModel<typeof services>;
type Reader = Pick<DrizzleDB, 'select'>;

/**
 * An Advisor's edit to their Service. The name and description are in the
 * request's language, so they are typed apart from the rest: they go through
 * the translation, everything else straight to the row.
 */
export type AdvisorServiceEdit = Omit<
  PgUpdateSetSource<typeof services>,
  'name' | 'description'
> & { name?: string; description?: string | null };

/**
 * Every column of a Service, its name and description in the request's
 * language. A function, not a constant: the language is the request's, so it is
 * read when each query is built.
 */
const localizedColumns = () => ({
  ...getTableColumns(services),
  name: serviceName(),
  description: serviceDescription(),
});

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
      .select(localizedColumns())
      .from(services)
      .where(eq(services.advisorId, advisorId))
      .orderBy(services.createdAt)
      .limit(options.limit)
      .offset(options.offset);
  }

  async countByAdvisorId(advisorId: string): Promise<number> {
    return this.count(eq(services.advisorId, advisorId));
  }

  /** Every Advisor's Services for the admin console, in the inherited `findMany`'s id order. */
  findManyLocalized(options: {
    limit: number;
    offset: number;
  }): Promise<AdvisorService[]> {
    return this.db
      .select(localizedColumns())
      .from(services)
      .orderBy(asc(services.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  async findOwnedById(
    advisorId: string,
    serviceId: string,
    db: Reader = this.db,
  ): Promise<AdvisorService | undefined> {
    const [service] = await db
      .select(localizedColumns())
      .from(services)
      .where(this.ownedWhere(advisorId, serviceId))
      .limit(1);
    return service;
  }

  /**
   * A new Service, its text written twice in one transaction: to the row's own
   * columns, the fallback for a language with no translation, and to the
   * translation for the language the Advisor wrote it in.
   */
  createLocalized(
    values: InferInsertModel<typeof services>,
  ): Promise<AdvisorService> {
    return this.db.transaction(async (tx) => {
      const [service] = await tx.insert(services).values(values).returning();
      await saveServiceTranslation(tx, service.id, {
        name: service.name,
        description: service.description,
      });
      return service;
    });
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

  /**
   * The edit's name and description go to the translation for the request's
   * language, merged over what that language reads now so a partial edit keeps
   * the other field. The row's own columns take them only in Thai, the source:
   * an edit made in English leaves the Thai as it was. Every other field goes to
   * the row as before. Returns the Service as the request's language now reads it.
   */
  updateOwned(
    advisorId: string,
    serviceId: string,
    { name, description, ...values }: AdvisorServiceEdit,
  ): Promise<AdvisorService | undefined> {
    return this.db.transaction(async (tx) => {
      const current = await this.findOwnedById(advisorId, serviceId, tx);
      if (!current) return undefined;

      const edited = name !== undefined || description !== undefined;
      const text = {
        name: name ?? current.name,
        description:
          description === undefined ? current.description : description,
      };
      const [service] = await tx
        .update(services)
        .set(edited && writesSourceText() ? { ...values, ...text } : values)
        .where(this.ownedWhere(advisorId, serviceId))
        .returning();
      if (!service) return undefined;
      if (edited) await saveServiceTranslation(tx, serviceId, text);
      return { ...service, ...text };
    });
  }

  /**
   * The service and its photographs, in one transaction.
   *
   * `service_images` references the service with no cascade, so deleting the
   * row alone fails as soon as it has photographs, which every seeded service
   * now does. The photographs go only once the same `ownedWhere` has found the
   * service, so another advisor's id deletes nothing, and a service that still
   * cannot go (it has bookings) keeps its photographs when the delete rolls back.
   * Its translations cascade, so what is returned is the localized read made
   * before the delete.
   */
  async deleteOwned(
    advisorId: string,
    serviceId: string,
  ): Promise<AdvisorService | undefined> {
    return this.db.transaction(async (tx) => {
      const owned = await this.findOwnedById(advisorId, serviceId, tx);
      if (!owned) return undefined;

      await tx
        .delete(serviceImages)
        .where(eq(serviceImages.serviceId, serviceId));
      const deleted = await tx
        .delete(services)
        .where(this.ownedWhere(advisorId, serviceId))
        .returning({ id: services.id });
      return deleted.length > 0 ? owned : undefined;
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

  /** A service's packages, in the order they are offered. */
  findPackagesFor(serviceId: string): Promise<ServicePackage[]> {
    return this.db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.serviceId, serviceId))
      .orderBy(asc(servicePackages.sortOrder), asc(servicePackages.createdAt));
  }

  /**
   * Makes a service's packages `packages`, in that order, in one transaction:
   * one with an `id` of this service's is changed in place (so bookings made
   * on it keep pointing at it), one without is added, and one not sent is
   * removed (bookings made on it keep their times, their link set to null).
   */
  replacePackages(
    serviceId: string,
    packages: readonly ServicePackageInputDto[],
  ): Promise<ServicePackage[]> {
    return this.db.transaction(async (tx) => {
      const kept = packages.flatMap((item) => (item.id ? [item.id] : []));
      await tx
        .delete(servicePackages)
        .where(
          kept.length > 0
            ? and(
                eq(servicePackages.serviceId, serviceId),
                notInArray(servicePackages.id, kept),
              )
            : eq(servicePackages.serviceId, serviceId),
        );
      const rows = packages.map((item, sortOrder) => ({
        id: item.id,
        values: {
          name: item.name,
          description: item.description ?? null,
          durationMinutes: item.durationMinutes,
          priceSatang: item.priceSatang,
          sortOrder,
        },
      }));
      // The kept packages updated in place, the new ones written in one insert; their
      // `sortOrder` carries the list's order, so neither has to run one by one.
      await Promise.all(
        rows.flatMap(({ id, values }) =>
          id
            ? [
                tx
                  .update(servicePackages)
                  .set(values)
                  .where(
                    and(
                      eq(servicePackages.id, id),
                      eq(servicePackages.serviceId, serviceId),
                    ),
                  ),
              ]
            : [],
        ),
      );
      const fresh = rows.flatMap(({ id, values }) =>
        id ? [] : [{ ...values, serviceId }],
      );
      if (fresh.length > 0) await tx.insert(servicePackages).values(fresh);
      return tx
        .select()
        .from(servicePackages)
        .where(eq(servicePackages.serviceId, serviceId))
        .orderBy(asc(servicePackages.sortOrder));
    });
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
        name: serviceName(),
        description: serviceDescription(),
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
    // Searches the text the reader is shown, in their language, not the Thai source.
    const textPredicate = text
      ? or(
          ilike(serviceName(), `%${escapeLike(text)}%`),
          ilike(serviceDescription(), `%${escapeLike(text)}%`),
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
