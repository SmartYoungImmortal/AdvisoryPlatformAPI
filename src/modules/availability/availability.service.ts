import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import { advisorGlobalAvailability } from '@/database/schema';
import { AVAILABILITY_MESSAGES } from './availability.constants';
import { AvailabilityRepository } from './availability.repository';
import {
  addDays,
  assertIanaTimeZone,
  dateInTimeZone,
  isoWeekday,
  zonedDateTimeToUtc,
} from './availability-time';
import type {
  SlotQueryDto,
  UpsertAvailabilityProfileDto,
} from './dtos/availability.dto';
import { AvailabilitySlotResponseDto } from './dtos/availability.dto';
import type { AvailabilityProfileDetails } from './availability.types';

type GlobalAvailability = InferSelectModel<typeof advisorGlobalAvailability>;
type SchedulingContext = Exclude<
  Awaited<ReturnType<AvailabilityRepository['schedulingContext']>>,
  undefined
>;
type BlockingAppointment = Awaited<
  ReturnType<AvailabilityRepository['findBlockingAppointments']>
>[number];

const minutes = (count: number): number => count * 60000;

/** The day's open windows: its weekday's and its own date's, merged. */
function windowsOn(context: SchedulingContext, date: string) {
  const weekly = context.weeklyWindows
    .filter((window) => window.dayOfWeek === isoWeekday(date))
    .map(({ startTime, endTime }) => ({ startTime, endTime }));
  const specific = context.specificWindows
    .filter((window) => window.availableDate === date)
    .map(({ startTime, endTime }) => ({ startTime, endTime }));
  return mergeRanges([...weekly, ...specific]);
}

/** Minutes already booked on `date` (the advisor's calendar), of one service or all. */
function minutesBookedOn(
  appointments: readonly BlockingAppointment[],
  date: string,
  timezone: string,
  serviceId?: string,
): number {
  return appointments
    .filter(
      (appointment) =>
        (serviceId === undefined || appointment.serviceId === serviceId) &&
        dateInTimeZone(appointment.startTime, timezone) === date,
    )
    .reduce(
      (total, appointment) =>
        total +
        (appointment.endTime.getTime() - appointment.startTime.getTime()) /
          60000,
      0,
    );
}

/** Whether one more session fits the advisor's daily limit and the service's. */
function withinDailyLimits(
  context: SchedulingContext,
  date: string,
  appointments: readonly BlockingAppointment[],
): boolean {
  const { durationMinutes, dailyConsultationLimitMinutes: serviceLimit } =
    context.service;
  const globalLimit = context.global.dailyConsultationLimitMinutes;
  if (
    globalLimit !== null &&
    minutesBookedOn(appointments, date, context.timezone) + durationMinutes >
      globalLimit
  )
    return false;
  return (
    serviceLimit === null ||
    minutesBookedOn(appointments, date, context.timezone, context.service.id) +
      durationMinutes <=
      serviceLimit
  );
}

/**
 * Whether `start`–`end` is clear of the day's blocked periods (a period with
 * no times blocks the whole day) and, with the buffer after it, of every
 * blocking appointment.
 */
function slotIsFree(
  context: SchedulingContext,
  date: string,
  start: Date,
  end: Date,
  appointments: readonly BlockingAppointment[],
): boolean {
  const blocked = context.blockedPeriods.some((period) => {
    if (period.blockedDate !== date) return false;
    if (!period.startTime || !period.endTime) return true;
    return overlaps(
      start,
      end,
      zonedDateTimeToUtc(date, period.startTime, context.timezone),
      zonedDateTimeToUtc(date, period.endTime, context.timezone),
    );
  });
  if (blocked) return false;
  const unavailableUntil = new Date(
    end.getTime() + minutes(context.global.bufferMinutes),
  );
  return !appointments.some((appointment) =>
    overlaps(
      start,
      unavailableUntil,
      appointment.startTime,
      appointment.unavailableUntil,
    ),
  );
}

/**
 * The instants a slot search between `from` and `to` spans, on the advisor's
 * own calendar: midnight at the start of `from` to midnight after `to`.
 */
function slotRange(
  context: SchedulingContext,
  from: string,
  to: string,
): { rangeStart: Date; rangeEnd: Date } {
  return {
    rangeStart: zonedDateTimeToUtc(from, '00:00', context.timezone),
    rangeEnd: zonedDateTimeToUtc(addDays(to, 1), '00:00', context.timezone),
  };
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly repository: AvailabilityRepository) {}

  async getGlobal(advisorId: string): Promise<GlobalAvailability> {
    const global = await this.repository.findGlobal(advisorId);
    if (!global)
      throw new NotFoundException(AVAILABILITY_MESSAGES.globalNotFound);
    return global;
  }

  upsertGlobal(
    advisorId: string,
    dto: Partial<GlobalAvailability>,
  ): Promise<GlobalAvailability> {
    return this.repository.upsertGlobal(advisorId, dto);
  }

  findProfiles(advisorId: string): Promise<AvailabilityProfileDetails[]> {
    return this.repository.findProfiles(advisorId);
  }

  async createProfile(
    advisorId: string,
    dto: UpsertAvailabilityProfileDto,
  ): Promise<AvailabilityProfileDetails> {
    this.assertWindows(dto);
    return this.repository.saveProfile(advisorId, undefined, dto);
  }

  async updateProfile(
    advisorId: string,
    profileId: string,
    dto: UpsertAvailabilityProfileDto,
  ): Promise<AvailabilityProfileDetails> {
    this.assertWindows(dto);
    if (!(await this.repository.findOwnedProfile(advisorId, profileId)))
      throw new NotFoundException(AVAILABILITY_MESSAGES.profileNotFound);
    return this.repository.saveProfile(advisorId, profileId, dto);
  }

  async deleteProfile(
    advisorId: string,
    profileId: string,
  ): Promise<AvailabilityProfileDetails> {
    if (!(await this.repository.findOwnedProfile(advisorId, profileId)))
      throw new NotFoundException(AVAILABILITY_MESSAGES.profileNotFound);
    if (await this.repository.isProfileInUse(profileId))
      throw new ConflictException(AVAILABILITY_MESSAGES.profileInUse);
    const profile = await this.repository.softDelete(advisorId, profileId);
    if (!profile)
      throw new NotFoundException(AVAILABILITY_MESSAGES.profileNotFound);
    return profile;
  }

  async findSlots(
    serviceId: string,
    query: SlotQueryDto,
    adviseeId: string,
  ): Promise<AvailabilitySlotResponseDto[]> {
    if (!isIsoDate(query.from) || !isIsoDate(query.to) || query.from > query.to)
      throw new BadRequestException(AVAILABILITY_MESSAGES.invalidRange);
    if (daysBetween(query.from, query.to) > 89)
      throw new BadRequestException(AVAILABILITY_MESSAGES.invalidRange);
    const context = await this.withPackage(
      await this.getSchedulingContext(serviceId),
      query.packageId,
    );
    await this.assertCanViewSlots(context, adviseeId);
    return this.deriveSlots(context, query.from, query.to);
  }

  async findSlotAt(
    serviceId: string,
    startTime: Date,
    adviseeId: string,
    packageId?: string | null,
  ): Promise<AvailabilitySlotResponseDto | undefined> {
    const context = await this.withPackage(
      await this.getSchedulingContext(serviceId),
      packageId,
    );
    await this.assertCanViewSlots(context, adviseeId);
    const date = dateInTimeZone(startTime, context.timezone);
    const slots = await this.deriveSlots(context, date, date);
    return slots.find(
      (slot) => slot.startTime.getTime() === startTime.getTime(),
    );
  }

  /**
   * Whether a published service has any bookable slot on one date, for the
   * discovery filter. It answers yes or no only, never the times, so it skips
   * the screening gate `findSlots` applies before showing a viewer the slots.
   * A service whose schedule cannot be read counts as not available rather than
   * failing the whole list.
   */
  /**
   * `hasOpenSlotOn` for many services at once: the ones with a slot left on
   * `date`. The same answer service by service, read in a fixed handful of
   * queries (the services, their schedules, and every advisor's blocking
   * appointments over the day) instead of several per service. A service
   * whose schedule cannot be read or worked out is simply not open, as it is
   * for the single check.
   */
  async openOn(
    serviceIds: readonly string[],
    date: string,
  ): Promise<ReadonlySet<string>> {
    const open = new Set<string>();
    if (!isIsoDate(date) || serviceIds.length === 0) return open;
    let contexts: ReadonlyMap<string, SchedulingContext>;
    try {
      contexts = await this.repository.schedulingContexts(serviceIds);
    } catch {
      return open;
    }

    const ranges = new Map<string, { rangeStart: Date; rangeEnd: Date }>();
    for (const [serviceId, context] of contexts) {
      try {
        assertIanaTimeZone(context.timezone);
        ranges.set(serviceId, slotRange(context, date, date));
      } catch {
        // An unusable time zone or date: not open, as `hasOpenSlotOn` says.
      }
    }
    if (ranges.size === 0) return open;

    // One read for every advisor over the widest of their days; each service
    // then keeps only what overlaps its own day, the same test as the query.
    const spans = [...ranges.values()];
    const from = new Date(
      Math.min(...spans.map((r) => r.rangeStart.getTime())),
    );
    const to = new Date(Math.max(...spans.map((r) => r.rangeEnd.getTime())));
    const advisorIds = [
      ...new Set(
        [...ranges.keys()].map((id) => contexts.get(id)!.service.advisorId),
      ),
    ];
    let appointments: BlockingAppointment[];
    try {
      appointments = await this.repository.findBlockingAppointmentsForAdvisors(
        advisorIds,
        from,
        to,
      );
    } catch {
      return open;
    }

    for (const [serviceId, range] of ranges) {
      const context = contexts.get(serviceId)!;
      const blocking = appointments.filter(
        (appointment) =>
          appointment.advisorId === context.service.advisorId &&
          appointment.startTime < range.rangeEnd &&
          appointment.unavailableUntil > range.rangeStart,
      );
      try {
        if (this.slotsFrom(context, date, date, blocking).length > 0)
          open.add(serviceId);
      } catch {
        // As above: a schedule that cannot be worked out is not open.
      }
    }
    return open;
  }

  async hasOpenSlotOn(serviceId: string, date: string): Promise<boolean> {
    if (!isIsoDate(date)) return false;
    try {
      const context = await this.getSchedulingContext(serviceId);
      const slots = await this.deriveSlots(context, date, date);
      return slots.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * The context with the package's length in place of the service's, so the
   * slots, the daily limit and the booking's end time all follow the package.
   * A package that is not this service's is refused, not quietly ignored.
   */
  private async withPackage(
    context: SchedulingContext,
    packageId: string | null | undefined,
  ): Promise<SchedulingContext> {
    if (!packageId) return context;
    const servicePackage = await this.repository.findPackage(
      context.service.id,
      packageId,
    );
    if (!servicePackage)
      throw new BadRequestException(AVAILABILITY_MESSAGES.packageNotFound);
    return {
      ...context,
      service: {
        ...context.service,
        durationMinutes: servicePackage.durationMinutes,
        priceSatang: servicePackage.priceSatang,
      },
    };
  }

  private async assertCanViewSlots(
    context: SchedulingContext,
    adviseeId: string,
  ): Promise<void> {
    if (
      context.service.screeningRequired &&
      !(await this.repository.hasAcceptedScreening(
        context.service.id,
        adviseeId,
      ))
    ) {
      throw new BadRequestException(AVAILABILITY_MESSAGES.screeningRequired);
    }
  }

  private async getSchedulingContext(
    serviceId: string,
  ): Promise<SchedulingContext> {
    const context = await this.repository.schedulingContext(serviceId);
    if (!context)
      throw new NotFoundException(AVAILABILITY_MESSAGES.unavailable);
    try {
      assertIanaTimeZone(context.timezone);
    } catch {
      throw new BadRequestException(AVAILABILITY_MESSAGES.invalidTimezone);
    }
    return context;
  }

  private async deriveSlots(
    context: SchedulingContext,
    from: string,
    to: string,
  ): Promise<AvailabilitySlotResponseDto[]> {
    try {
      return await this.deriveSlotsUnsafe(context, from, to);
    } catch (error: unknown) {
      if (error instanceof RangeError)
        throw new BadRequestException(AVAILABILITY_MESSAGES.invalidRange);
      throw error;
    }
  }

  private async deriveSlotsUnsafe(
    context: SchedulingContext,
    from: string,
    to: string,
  ): Promise<AvailabilitySlotResponseDto[]> {
    const { rangeStart, rangeEnd } = slotRange(context, from, to);
    const appointments = await this.repository.findBlockingAppointments(
      context.service.advisorId,
      rangeStart,
      rangeEnd,
    );
    return this.slotsFrom(context, from, to, appointments);
  }

  /**
   * The slots between `from` and `to`, given the appointments that block the
   * advisor across that range: no reads of its own, so a batch can hand it the
   * appointments it read for many advisors at once.
   */
  private slotsFrom(
    context: SchedulingContext,
    from: string,
    to: string,
    appointments: readonly BlockingAppointment[],
  ): AvailabilitySlotResponseDto[] {
    const now = new Date();
    const earliestStart = new Date(
      now.getTime() + context.global.minimumBookingNoticeMinutes * 60000,
    );
    const latestDate = addDays(
      dateInTimeZone(now, context.timezone),
      context.global.bookingHorizonDays,
    );
    const slots: AvailabilitySlotResponseDto[] = [];
    for (let date = from; date <= to; date = addDays(date, 1)) {
      // The daily limits depend on the day, not the slot: a day over either
      // has no slot at all.
      if (date > latestDate || !withinDailyLimits(context, date, appointments))
        continue;
      for (const range of windowsOn(context, date)) {
        const rangeEnd = zonedDateTimeToUtc(
          date,
          range.endTime,
          context.timezone,
        );
        for (
          let start = zonedDateTimeToUtc(
            date,
            range.startTime,
            context.timezone,
          );
          start < rangeEnd;
          start = new Date(
            start.getTime() + minutes(context.global.slotIntervalMinutes),
          )
        ) {
          const end = new Date(
            start.getTime() + minutes(context.service.durationMinutes),
          );
          if (
            end <= rangeEnd &&
            start >= earliestStart &&
            slotIsFree(context, date, start, end, appointments)
          )
            slots.push(new AvailabilitySlotResponseDto(start, end));
        }
      }
    }
    return slots;
  }

  private assertWindows(dto: UpsertAvailabilityProfileDto): void {
    const ranges = new Map<
      string,
      Array<{ startTime: string; endTime: string }>
    >();
    for (const window of dto.weeklyWindows) {
      this.assertWindowTimes(window.startTime, window.endTime);
      addRange(ranges, `weekly:${window.dayOfWeek}`, window);
    }
    for (const window of dto.specificWindows ?? []) {
      if (!isIsoDate(window.availableDate))
        throw new BadRequestException(AVAILABILITY_MESSAGES.invalidWindows);
      this.assertWindowTimes(window.startTime, window.endTime);
      addRange(ranges, `specific:${window.availableDate}`, window);
    }
    for (const [key, values] of ranges) {
      values.sort(
        (a, b) => wallClockSeconds(a.startTime) - wallClockSeconds(b.startTime),
      );
      if (
        values.some(
          (value, index) =>
            wallClockSeconds(value.startTime) >=
              wallClockSeconds(value.endTime) ||
            (index > 0 &&
              wallClockSeconds(values[index - 1].endTime) >
                wallClockSeconds(value.startTime)),
        )
      )
        throw new BadRequestException(
          `${AVAILABILITY_MESSAGES.invalidWindows}: ${key}`,
        );
    }
    for (const period of dto.blockedPeriods ?? []) {
      if (
        !isIsoDate(period.blockedDate) ||
        (period.startTime === undefined) !== (period.endTime === undefined) ||
        (period.startTime !== undefined &&
          period.endTime !== undefined &&
          (!isWallClockTime(period.startTime) ||
            !isWallClockTime(period.endTime) ||
            wallClockSeconds(period.startTime) >=
              wallClockSeconds(period.endTime)))
      )
        throw new BadRequestException(AVAILABILITY_MESSAGES.invalidWindows);
    }
  }

  private assertWindowTimes(startTime: string, endTime: string): void {
    if (
      !isWallClockTime(startTime) ||
      !isWallClockTime(endTime) ||
      !isSlotGridTime(startTime) ||
      !isSlotGridTime(endTime)
    )
      throw new BadRequestException(AVAILABILITY_MESSAGES.invalidWindows);
  }
}

function addRange(
  ranges: Map<string, Array<{ startTime: string; endTime: string }>>,
  key: string,
  window: { startTime: string; endTime: string },
): void {
  const values = ranges.get(key) ?? [];
  values.push(window);
  ranges.set(key, values);
}
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
function daysBetween(from: string, to: string): number {
  return (
    (new Date(`${to}T00:00:00.000Z`).getTime() -
      new Date(`${from}T00:00:00.000Z`).getTime()) /
    86400000
  );
}
function overlaps(
  start: Date,
  end: Date,
  otherStart: Date,
  otherEnd: Date,
): boolean {
  return start < otherEnd && end > otherStart;
}
function isSlotGridTime(time: string): boolean {
  const match = /^(\d{2}):(\d{2})(?::00)?$/.exec(time);
  return (
    !!match &&
    Number(match[1]) < 24 &&
    Number(match[2]) < 60 &&
    Number(match[2]) % 30 === 0
  );
}

function isWallClockTime(time: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time);
}

function wallClockSeconds(time: string): number {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function mergeRanges(
  ranges: Array<{ startTime: string; endTime: string }>,
): Array<{ startTime: string; endTime: string }> {
  const sorted = [...ranges].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  const merged: Array<{ startTime: string; endTime: string }> = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (!previous || previous.endTime < range.startTime) {
      merged.push({ ...range });
    } else if (range.endTime > previous.endTime) {
      previous.endTime = range.endTime;
    }
  }
  return merged;
}
