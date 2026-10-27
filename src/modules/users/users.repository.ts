import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, or, type InferSelectModel } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  account,
  advisorIdentity,
  advisorProfileTranslations,
  advisorProfiles,
  advisorSkills,
  notifications,
  services,
  session,
  serviceAppointments,
  skillProofDocuments,
  user,
  verification,
  appointmentStateEnum,
} from '@/database/schema';
import { EntityRepository } from '@/common/repositories/entity.repository';

type User = InferSelectModel<typeof user>;

export interface UpcomingAppointmentDeletionBlocker {
  appointmentId: string;
  startTime: Date;
  state: 'PENDING_PAYMENT' | 'BOOKED';
}

type AppointmentDeletionCandidate = {
  appointmentId: string;
  startTime: Date;
  state: (typeof appointmentStateEnum.enumValues)[number];
};

function isUpcomingAppointmentBlocker(
  candidate: AppointmentDeletionCandidate,
): candidate is UpcomingAppointmentDeletionBlocker {
  return candidate.state === 'PENDING_PAYMENT' || candidate.state === 'BOOKED';
}

export type AnonymizeByIdResult =
  | { status: 'not-found' }
  | {
      status: 'blocked';
      upcomingAppointments: UpcomingAppointmentDeletionBlocker[];
    }
  | { status: 'deleted'; profile: User };

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

  replaceAvatar(
    userId: string,
    avatarKey: string,
  ): Promise<Pick<User, 'avatarKey'> | undefined> {
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
        .set({ avatarKey, updatedAt: new Date() })
        .where(eq(user.id, userId));

      return profile;
    });
  }

  /**
   * Erases direct account/profile data while retaining the pseudonymous user row required by
   * appointments, invoices, reports, and chat evidence. The transaction also revokes every login
   * credential and session, so a completed deletion cannot leave an authenticated account behind.
   */
  async findDeletionBlockers(
    userId: string,
    now = new Date(),
  ): Promise<UpcomingAppointmentDeletionBlocker[]> {
    const candidates = await this.database
      .select({
        appointmentId: serviceAppointments.id,
        startTime: serviceAppointments.startTime,
        state: serviceAppointments.state,
      })
      .from(serviceAppointments)
      .where(
        and(
          gte(serviceAppointments.startTime, now),
          inArray(serviceAppointments.state, ['PENDING_PAYMENT', 'BOOKED']),
          or(
            eq(serviceAppointments.advisorId, userId),
            eq(serviceAppointments.adviseeId, userId),
          ),
        ),
      )
      .orderBy(serviceAppointments.startTime);
    return candidates.filter(isUpcomingAppointmentBlocker);
  }

  anonymizeById(userId: string): Promise<AnonymizeByIdResult> {
    return this.database.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
        .for('update');

      if (!profile) {
        return { status: 'not-found' };
      }

      const now = new Date();
      const appointmentCandidates = await tx
        .select({
          appointmentId: serviceAppointments.id,
          startTime: serviceAppointments.startTime,
          state: serviceAppointments.state,
        })
        .from(serviceAppointments)
        .where(
          and(
            gte(serviceAppointments.startTime, now),
            inArray(serviceAppointments.state, ['PENDING_PAYMENT', 'BOOKED']),
            or(
              eq(serviceAppointments.advisorId, userId),
              eq(serviceAppointments.adviseeId, userId),
            ),
          ),
        )
        .orderBy(serviceAppointments.startTime);
      const upcomingAppointments = appointmentCandidates.filter(
        isUpcomingAppointmentBlocker,
      );
      if (upcomingAppointments.length > 0) {
        return { status: 'blocked', upcomingAppointments };
      }

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
      // The translations go too, or a reader in their language would still
      // see the old headline and bio over the placeholder.
      await tx
        .delete(advisorProfileTranslations)
        .where(eq(advisorProfileTranslations.advisorId, userId));
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

      return deletedProfile
        ? { status: 'deleted', profile }
        : { status: 'not-found' };
    });
  }
}
