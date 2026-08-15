import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import { adminProfiles, advisorProfiles, user } from '../../database/schema';
import { EntityRepository } from '../../common/repositories/entity.repository';

export interface RoleMembership {
  isAdvisor: boolean;
  isAdmin: boolean;
}

@Injectable()
export class UsersRepository extends EntityRepository<typeof user> {
  constructor(@Inject(DRIZZLE) private readonly database: DrizzleDB) {
    super(database, user);
  }

  async findRoleMembership(userId: string): Promise<RoleMembership> {
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
