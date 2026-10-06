import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { adminProfiles, advisorProfiles } from '@/database/schema';
import { isVerifiedAdvisor } from './verified-advisor.predicate';

export interface RoleMembership {
  isAdvisor: boolean;
  isAdmin: boolean;
}

@Injectable()
export class RoleRepository {
  constructor(@Inject(DRIZZLE) private readonly database: DrizzleDB) {}

  /**
   * An applicant has an Advisor profile before an admin has looked at them, so
   * Advisor membership is the profile *and* a verified identity — the same moment
   * the approval writes `user.role = 'advisor'` for better-auth's access control.
   */
  async findMembership(userId: string): Promise<RoleMembership> {
    const [advisor, admin] = await Promise.all([
      this.database
        .select({ userId: advisorProfiles.userId })
        .from(advisorProfiles)
        .where(
          and(
            eq(advisorProfiles.userId, userId),
            isVerifiedAdvisor(advisorProfiles.userId),
          ),
        )
        .limit(1),
      this.database
        .select({ userId: adminProfiles.userId })
        .from(adminProfiles)
        .where(eq(adminProfiles.userId, userId))
        .limit(1),
    ]);

    return {
      isAdvisor: advisor.length > 0,
      isAdmin: admin.length > 0,
    };
  }
}
