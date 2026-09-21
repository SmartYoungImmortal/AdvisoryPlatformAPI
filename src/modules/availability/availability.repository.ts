import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lt, type InferSelectModel } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  advisorGlobalAvailability,
  availabilityBlockedPeriods,
  availabilityProfiles,
  availabilitySpecificWindows,
  availabilityWeeklyWindows,
  screeningRequests,
  serviceAppointments,
  services,
  user,
} from '@/database/schema';
import type {
  BlockedPeriodDto,
  SpecificWindowDto,
  UpsertAvailabilityProfileDto,
  WeeklyWindowDto,
} from './dtos/availability.dto';
import type { AvailabilityProfileDetails } from './availability.types';

type AvailabilityProfile = InferSelectModel<typeof availabilityProfiles>;

@Injectable()
export class AvailabilityRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findGlobal(advisorId: string) {
    const [global] = await this.db
      .select()
      .from(advisorGlobalAvailability)
      .where(eq(advisorGlobalAvailability.advisorId, advisorId))
      .limit(1);
    return global;
  }

  async upsertGlobal(
    advisorId: string,
    values: Partial<InferSelectModel<typeof advisorGlobalAvailability>>,
  ) {
    const [global] = await this.db
      .insert(advisorGlobalAvailability)
      .values({ advisorId, ...values })
      .onConflictDoUpdate({
        target: advisorGlobalAvailability.advisorId,
        set: values,
      })
      .returning();
    return global;
  }

  async findProfiles(advisorId: string): Promise<AvailabilityProfileDetails[]> {
    const profiles = await this.db
      .select()
      .from(availabilityProfiles)
      .where(
        and(
          eq(availabilityProfiles.advisorId, advisorId),
          isNull(availabilityProfiles.deletedAt),
        ),
      );
    return Promise.all(profiles.map((profile) => this.profileDetails(profile)));
  }

  async findOwnedProfile(
    advisorId: string,
    profileId: string,
  ): Promise<AvailabilityProfile | undefined> {
    const [profile] = await this.db
      .select()
      .from(availabilityProfiles)
      .where(
        and(
          eq(availabilityProfiles.id, profileId),
          eq(availabilityProfiles.advisorId, advisorId),
          isNull(availabilityProfiles.deletedAt),
        ),
      )
      .limit(1);
    return profile;
  }

  async saveProfile(
    advisorId: string,
    profileId: string | undefined,
    dto: UpsertAvailabilityProfileDto,
  ): Promise<AvailabilityProfileDetails> {
    const profile = await this.db.transaction(async (tx) => {
      const profile = profileId
        ? (
            await tx
              .update(availabilityProfiles)
              .set({ name: dto.name, modifiedAt: new Date() })
              .where(
                and(
                  eq(availabilityProfiles.id, profileId),
                  eq(availabilityProfiles.advisorId, advisorId),
                ),
              )
              .returning()
          )[0]
        : (
            await tx
              .insert(availabilityProfiles)
              .values({ advisorId, name: dto.name })
              .returning()
          )[0];
      if (!profile) throw new Error('Availability profile was not found');
      await tx
        .delete(availabilityWeeklyWindows)
        .where(eq(availabilityWeeklyWindows.availabilityProfileId, profile.id));
      await tx
        .delete(availabilitySpecificWindows)
        .where(
          eq(availabilitySpecificWindows.availabilityProfileId, profile.id),
        );
      await tx
        .delete(availabilityBlockedPeriods)
        .where(
          eq(availabilityBlockedPeriods.availabilityProfileId, profile.id),
        );
      if (dto.weeklyWindows.length) {
        await tx.insert(availabilityWeeklyWindows).values(
          dto.weeklyWindows.map((window: WeeklyWindowDto) => ({
            availabilityProfileId: profile.id,
            ...window,
          })),
        );
      }
      if (dto.specificWindows?.length) {
        await tx.insert(availabilitySpecificWindows).values(
          dto.specificWindows.map((window: SpecificWindowDto) => ({
            availabilityProfileId: profile.id,
            ...window,
          })),
        );
      }
      if (dto.blockedPeriods?.length) {
        await tx.insert(availabilityBlockedPeriods).values(
          dto.blockedPeriods.map((period: BlockedPeriodDto) => ({
            availabilityProfileId: profile.id,
            blockedDate: period.blockedDate,
            startTime: period.startTime ?? null,
            endTime: period.endTime ?? null,
          })),
        );
      }
      return profile;
    });
    return this.profileDetails(profile);
  }

  async softDelete(
    advisorId: string,
    profileId: string,
  ): Promise<AvailabilityProfileDetails | undefined> {
    const [profile] = await this.db
      .update(availabilityProfiles)
      .set({ deletedAt: new Date(), modifiedAt: new Date() })
      .where(
        and(
          eq(availabilityProfiles.id, profileId),
          eq(availabilityProfiles.advisorId, advisorId),
          isNull(availabilityProfiles.deletedAt),
        ),
      )
      .returning();
    return profile ? this.profileDetails(profile) : undefined;
  }

  async schedulingContext(serviceId: string) {
    const [serviceContext] = await this.db
      .select({ service: services, timezone: user.timezone })
      .from(services)
      .innerJoin(user, eq(user.id, services.advisorId))
      .where(and(eq(services.id, serviceId), eq(services.isPublished, true)))
      .limit(1);
    const service = serviceContext?.service;
    if (!service?.availabilityProfileId) return undefined;
    const [
      global,
      profileRows,
      weeklyWindows,
      specificWindows,
      blockedPeriods,
    ] = await Promise.all([
      this.findGlobal(service.advisorId),
      this.db
        .select()
        .from(availabilityProfiles)
        .where(
          and(
            eq(availabilityProfiles.id, service.availabilityProfileId),
            isNull(availabilityProfiles.deletedAt),
          ),
        )
        .limit(1),
      this.db
        .select()
        .from(availabilityWeeklyWindows)
        .where(
          eq(
            availabilityWeeklyWindows.availabilityProfileId,
            service.availabilityProfileId,
          ),
        ),
      this.db
        .select()
        .from(availabilitySpecificWindows)
        .where(
          eq(
            availabilitySpecificWindows.availabilityProfileId,
            service.availabilityProfileId,
          ),
        ),
      this.db
        .select()
        .from(availabilityBlockedPeriods)
        .where(
          eq(
            availabilityBlockedPeriods.availabilityProfileId,
            service.availabilityProfileId,
          ),
        ),
    ]);
    const [profile] = profileRows;
    return global && profile
      ? {
          service,
          timezone: serviceContext.timezone,
          global,
          weeklyWindows,
          specificWindows,
          blockedPeriods,
        }
      : undefined;
  }

  async findBlockingAppointments(advisorId: string, from: Date, to: Date) {
    return this.db
      .select()
      .from(serviceAppointments)
      .where(
        and(
          eq(serviceAppointments.advisorId, advisorId),
          eq(serviceAppointments.blocksAvailability, true),
          lt(serviceAppointments.startTime, to),
          gt(serviceAppointments.unavailableUntil, from),
        ),
      );
  }

  async hasAcceptedScreening(
    serviceId: string,
    adviseeId: string,
  ): Promise<boolean> {
    const [request] = await this.db
      .select({ id: screeningRequests.id })
      .from(screeningRequests)
      .where(
        and(
          eq(screeningRequests.serviceId, serviceId),
          eq(screeningRequests.adviseeId, adviseeId),
          eq(screeningRequests.status, 'ACCEPTED'),
        ),
      )
      .limit(1);
    return request !== undefined;
  }

  private async profileDetails(
    profile: AvailabilityProfile,
  ): Promise<AvailabilityProfileDetails> {
    const [weeklyWindows, specificWindows, blockedPeriods] = await Promise.all([
      this.db
        .select()
        .from(availabilityWeeklyWindows)
        .where(eq(availabilityWeeklyWindows.availabilityProfileId, profile.id)),
      this.db
        .select()
        .from(availabilitySpecificWindows)
        .where(
          eq(availabilitySpecificWindows.availabilityProfileId, profile.id),
        ),
      this.db
        .select()
        .from(availabilityBlockedPeriods)
        .where(
          eq(availabilityBlockedPeriods.availabilityProfileId, profile.id),
        ),
    ]);
    return { profile, weeklyWindows, specificWindows, blockedPeriods };
  }
}
