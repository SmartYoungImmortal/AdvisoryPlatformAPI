import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import { adminProfiles, advisorProfiles } from '../../database/schema';

export interface RoleMembership {
  isAdvisor: boolean;
  isAdmin: boolean;
}

@Injectable()
export class RoleRepository {
  constructor(@Inject(DRIZZLE) private readonly database: DrizzleDB) {}

  async findMembership(userId: string): Promise<RoleMembership> {
    const [advisor, admin] = await Promise.all([
      this.database
        .select({ userId: advisorProfiles.userId })
        .from(advisorProfiles)
        .where(eq(advisorProfiles.userId, userId))
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
