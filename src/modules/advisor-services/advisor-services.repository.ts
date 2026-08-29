import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, type InferSelectModel, type SQL } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  availabilityProfiles,
  serviceCategories,
  services,
  user,
} from '@/database/schema';
import type { PublicServiceSearchDocument } from './advisor-services.types';

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
    return this.db
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

  async deleteOwned(
    advisorId: string,
    serviceId: string,
  ): Promise<AdvisorService | undefined> {
    const [service] = await this.deleteWhere(
      this.ownedWhere(advisorId, serviceId),
    );
    return service;
  }

  async findPublishedByIds(
    ids: string[],
  ): Promise<PublicServiceSearchDocument[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.findPublished(inArray(services.id, ids));
  }

  async findPublishedById(
    serviceId: string,
  ): Promise<PublicServiceSearchDocument | undefined> {
    const [service] = await this.findPublished(eq(services.id, serviceId));
    return service;
  }

  async findAllPublished(): Promise<PublicServiceSearchDocument[]> {
    return this.findPublished();
  }

  private ownedWhere(advisorId: string, serviceId: string): SQL {
    return and(
      eq(services.id, serviceId),
      eq(services.advisorId, advisorId),
    ) as SQL;
  }

  private findPublished(
    idPredicate?: SQL,
  ): Promise<PublicServiceSearchDocument[]> {
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
      })
      .from(services)
      .innerJoin(user, eq(user.id, services.advisorId))
      .where(
        and(
          eq(services.isPublished, true),
          eq(user.status, 'ACTIVE'),
          eq(user.banned, false),
          idPredicate,
        ),
      );
  }
}
