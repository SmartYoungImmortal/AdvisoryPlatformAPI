import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  type InferSelectModel,
} from 'drizzle-orm';
import { isVerifiedAdvisor } from '@/common/authorization/verified-advisor.predicate';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  advisorGlobalAvailability,
  availabilityBlockedPeriods,
  availabilityProfiles,
  availabilitySpecificWindows,
  availabilityWeeklyWindows,
  screeningRequests,
  serviceAppointments,
  servicePackages,
  serviceScreeningQuestions,
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

  async isProfileInUse(profileId: string): Promise<boolean> {
    const [service] = await this.db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.availabilityProfileId, profileId))
      .limit(1);
    return service !== undefined;
  }

  /** One of a service's packages, or undefined when it is not one of them. */
  async findPackage(serviceId: string, packageId: string) {
    const [row] = await this.db
      .select()
      .from(servicePackages)
      .where(
        and(
          eq(servicePackages.id, packageId),
          eq(servicePackages.serviceId, serviceId),
        ),
      )
      .limit(1);
    return row;
  }

  async schedulingContext(serviceId: string) {
    const [serviceContext] = await this.db
      .select({ service: services, timezone: user.timezone })
      .from(services)
      .innerJoin(user, eq(user.id, services.advisorId))
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.isPublished, true),
          isVerifiedAdvisor(services.advisorId),
        ),
      )
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

  /**
   * `schedulingContext` for many services in one pass: the services, then
   * each table of their schedules once for the lot, assembled per service by
   * the same rules (published, verified advisor, a live profile, a global
   * setting). A service that would get `undefined` alone is simply absent.
   */
  async schedulingContexts(serviceIds: readonly string[]) {
    type Context = NonNullable<
      Awaited<ReturnType<AvailabilityRepository['schedulingContext']>>
    >;
    const contexts = new Map<string, Context>();
    if (serviceIds.length === 0) return contexts;
    const rows = await this.db
      .select({ service: services, timezone: user.timezone })
      .from(services)
      .innerJoin(user, eq(user.id, services.advisorId))
      .where(
        and(
          inArray(services.id, [...serviceIds]),
          eq(services.isPublished, true),
          isVerifiedAdvisor(services.advisorId),
        ),
      );
    const scheduled = rows.filter((row) => row.service.availabilityProfileId);
    if (scheduled.length === 0) return contexts;
    const advisorIds = [
      ...new Set(scheduled.map((row) => row.service.advisorId)),
    ];
    const profileIds = [
      ...new Set(scheduled.map((row) => row.service.availabilityProfileId!)),
    ];
    const [globals, profiles, weekly, specific, blocked] = await Promise.all([
      this.db
        .select()
        .from(advisorGlobalAvailability)
        .where(inArray(advisorGlobalAvailability.advisorId, advisorIds)),
      this.db
        .select({ id: availabilityProfiles.id })
        .from(availabilityProfiles)
        .where(
          and(
            inArray(availabilityProfiles.id, profileIds),
            isNull(availabilityProfiles.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(availabilityWeeklyWindows)
        .where(
          inArray(availabilityWeeklyWindows.availabilityProfileId, profileIds),
        ),
      this.db
        .select()
        .from(availabilitySpecificWindows)
        .where(
          inArray(
            availabilitySpecificWindows.availabilityProfileId,
            profileIds,
          ),
        ),
      this.db
        .select()
        .from(availabilityBlockedPeriods)
        .where(
          inArray(availabilityBlockedPeriods.availabilityProfileId, profileIds),
        ),
    ]);
    const globalOf = new Map(
      globals.map((global) => [global.advisorId, global]),
    );
    const liveProfiles = new Set(profiles.map((profile) => profile.id));
    for (const { service, timezone } of scheduled) {
      const profileId = service.availabilityProfileId!;
      const global = globalOf.get(service.advisorId);
      if (!global || !liveProfiles.has(profileId)) continue;
      contexts.set(service.id, {
        service,
        timezone,
        global,
        weeklyWindows: weekly.filter(
          (w) => w.availabilityProfileId === profileId,
        ),
        specificWindows: specific.filter(
          (w) => w.availabilityProfileId === profileId,
        ),
        blockedPeriods: blocked.filter(
          (p) => p.availabilityProfileId === profileId,
        ),
      });
    }
    return contexts;
  }

  /** `findBlockingAppointments` for many advisors over one span, in one query. */
  async findBlockingAppointmentsForAdvisors(
    advisorIds: readonly string[],
    from: Date,
    to: Date,
  ) {
    if (advisorIds.length === 0) return [];
    return await this.db
      .select()
      .from(serviceAppointments)
      .where(
        and(
          inArray(serviceAppointments.advisorId, [...advisorIds]),
          eq(serviceAppointments.blocksAvailability, true),
          lt(serviceAppointments.startTime, to),
          gt(serviceAppointments.unavailableUntil, from),
        ),
      );
  }

  async findBlockingAppointments(advisorId: string, from: Date, to: Date) {
    return await this.db
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

  /** Whether the Service asks any question: screening a Service that asks none cannot be done. */
  async hasScreeningQuestions(serviceId: string): Promise<boolean> {
    const [question] = await this.db
      .select({ id: serviceScreeningQuestions.id })
      .from(serviceScreeningQuestions)
      .where(
        and(
          eq(serviceScreeningQuestions.serviceId, serviceId),
          isNull(serviceScreeningQuestions.deletedAt),
        ),
      )
      .limit(1);
    return question !== undefined;
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
