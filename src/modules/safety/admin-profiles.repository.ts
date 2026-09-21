import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { adminProfiles } from '@/database/schema';

/**
 * Does this admin have the `admin_profiles` row every ruling's foreign key points at?
 *
 * Both moderation queues stamp `reviewed_by_admin_id`, and both of those columns reference
 * `admin_profiles.user_id` rather than `user.id`. Holding the admin permission and having
 * that row are two different facts in this schema — better-auth grants the permission from
 * `user.role`, while `RoleResolver` derives Admin from this table — so a ruling asks here
 * first and refuses cleanly instead of failing as a 23503 on an authorised request.
 *
 * One provider rather than a copy in each queue's repository: it is the same question about
 * the same table, and two copies would be two places to fix when the model changes.
 */
@Injectable()
export class AdminProfilesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async exists(userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ userId: adminProfiles.userId })
      .from(adminProfiles)
      .where(eq(adminProfiles.userId, userId))
      .limit(1);
    return row !== undefined;
  }
}
