import { Inject, Injectable } from '@nestjs/common';
import { InferSelectModel, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import { advisorProfiles } from '../../database/schema';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { UpdateAdvisorProfileDto } from './dtos/update-advisor-profile.dto';

type AdvisorProfile = InferSelectModel<typeof advisorProfiles>;

/**
 * Not an `EntityRepository` — `advisorProfiles`'s PK is `userId` (a 1:1 extension of
 * `user`, per docs/ER.README.md's no-surrogate-id list), so it has no `id` column for
 * the generic base to key off of.
 */
@Injectable()
export class AdvisorsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByUserId(userId: string): Promise<AdvisorProfile | undefined> {
    const [advisor] = await this.db
      .select()
      .from(advisorProfiles)
      .where(eq(advisorProfiles.userId, userId))
      .limit(1);
    return advisor;
  }

  async createIfAbsent(
    userId: string,
    dto: CreateAdvisorProfileDto,
  ): Promise<AdvisorProfile | undefined> {
    const [advisor] = await this.db
      .insert(advisorProfiles)
      .values({ userId, ...dto })
      .onConflictDoNothing()
      .returning();
    return advisor;
  }

  async updateByUserId(
    userId: string,
    dto: UpdateAdvisorProfileDto,
  ): Promise<AdvisorProfile | undefined> {
    const [advisor] = await this.db
      .update(advisorProfiles)
      .set({ ...dto, modifiedAt: new Date() })
      .where(eq(advisorProfiles.userId, userId))
      .returning();
    return advisor;
  }
}
