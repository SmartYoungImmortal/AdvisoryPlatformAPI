import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import { advisorProfiles } from '../../database/schema';

/**
 * Not an `EntityRepository` — `advisorProfiles`'s PK is `userId` (a 1:1 extension of
 * `user`, per docs/ER.README.md's no-surrogate-id list), so it has no `id` column for
 * the generic base to key off of.
 */
@Injectable()
export class AdvisorsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByUserId(userId: string) {
    const [advisor] = await this.db
      .select()
      .from(advisorProfiles)
      .where(eq(advisorProfiles.userId, userId))
      .limit(1);
    return advisor;
  }
}
