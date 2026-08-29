import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  count,
  eq,
  type InferInsertModel,
  type InferSelectModel,
} from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  availabilityProfiles,
  serviceCategories,
  services,
} from '@/database/schema';

type AdvisorService = InferSelectModel<typeof services>;
type NewAdvisorService = InferInsertModel<typeof services>;

@Injectable()
export class AdvisorServicesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

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
    const [result] = await this.db
      .select({ value: count() })
      .from(services)
      .where(eq(services.advisorId, advisorId));
    return result?.value ?? 0;
  }

  async findOwnedById(
    advisorId: string,
    serviceId: string,
  ): Promise<AdvisorService | undefined> {
    const [service] = await this.db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.advisorId, advisorId)))
      .limit(1);
    return service;
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

  async create(values: NewAdvisorService): Promise<AdvisorService> {
    const [service] = await this.db.insert(services).values(values).returning();
    return service;
  }

  async updateOwned(
    advisorId: string,
    serviceId: string,
    values: Partial<NewAdvisorService>,
  ): Promise<AdvisorService | undefined> {
    const [service] = await this.db
      .update(services)
      .set(values)
      .where(and(eq(services.id, serviceId), eq(services.advisorId, advisorId)))
      .returning();
    return service;
  }

  async deleteOwned(
    advisorId: string,
    serviceId: string,
  ): Promise<AdvisorService | undefined> {
    const [service] = await this.db
      .delete(services)
      .where(and(eq(services.id, serviceId), eq(services.advisorId, advisorId)))
      .returning();
    return service;
  }
}
