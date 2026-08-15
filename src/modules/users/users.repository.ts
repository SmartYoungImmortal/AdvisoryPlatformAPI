import { Inject, Injectable } from '@nestjs/common';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import {
  account,
  advisorIdentity,
  advisorProfiles,
  advisorSkills,
  notifications,
  services,
  session,
  skillProofDocuments,
  user,
  verification,
} from '../../database/schema';
import { EntityRepository } from '../../common/repositories/entity.repository';

type User = InferSelectModel<typeof user>;

@Injectable()
export class UsersRepository extends EntityRepository<typeof user> {
  constructor(@Inject(DRIZZLE) private readonly database: DrizzleDB) {
    super(database, user);
  }

  removeAvatar(userId: string): Promise<Pick<User, 'avatarKey'> | undefined> {
    return this.database.transaction(async (tx) => {
      const [profile] = await tx
        .select({ avatarKey: user.avatarKey })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
        .for('update');

      if (!profile) {
        return undefined;
      }

      await tx
        .update(user)
        .set({ avatarKey: null, updatedAt: new Date() })
        .where(eq(user.id, userId));

      return profile;
    });
  }

  /**
   * Erases direct account/profile data while retaining the pseudonymous user row required by
   * appointments, invoices, reports, and chat evidence. The transaction also revokes every login
   * credential and session, so a completed deletion cannot leave an authenticated account behind.
   */
  anonymizeById(userId: string): Promise<User | undefined> {
    return this.database.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
        .for('update');

      if (!profile) {
        return undefined;
      }

      const now = new Date();

      await tx.delete(session).where(eq(session.userId, userId));
      await tx.delete(account).where(eq(account.userId, userId));
      await tx
        .delete(verification)
        .where(eq(verification.identifier, profile.email));
      await tx
        .delete(skillProofDocuments)
        .where(eq(skillProofDocuments.advisorId, userId));
      await tx.delete(advisorSkills).where(eq(advisorSkills.advisorId, userId));
      await tx
        .delete(advisorIdentity)
        .where(eq(advisorIdentity.advisorId, userId));
      await tx.delete(notifications).where(eq(notifications.ownerId, userId));

      await tx
        .update(services)
        .set({ isPublished: false, modifiedAt: now })
        .where(eq(services.advisorId, userId));
      await tx
        .update(advisorProfiles)
        .set({ headline: 'Deleted advisor', bio: null, modifiedAt: now })
        .where(eq(advisorProfiles.userId, userId));

      const [deletedProfile] = await tx
        .update(user)
        .set({
          email: `${userId}@deleted.invalid`,
          emailVerified: false,
          displayName: 'Deleted User',
          image: null,
          fullName: 'Deleted User',
          avatarKey: null,
          timezone: 'UTC',
          status: 'DELETED',
          updatedAt: now,
        })
        .where(eq(user.id, userId))
        .returning({ id: user.id });

      return deletedProfile ? profile : undefined;
    });
  }
}
