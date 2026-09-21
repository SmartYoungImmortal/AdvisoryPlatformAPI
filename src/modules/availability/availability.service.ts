import {
  BadRequestException,
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
    const context = await this.getSchedulingContext(serviceId);
    await this.assertCanViewSlots(context, adviseeId);
    return this.deriveSlots(context, query.from, query.to);
  }

  async findSlotAt(
    serviceId: string,
    startTime: Date,
    adviseeId: string,
  ): Promise<AvailabilitySlotResponseDto | undefined> {
    const context = await this.getSchedulingContext(serviceId);
    await this.assertCanViewSlots(context, adviseeId);
    const date = dateInTimeZone(startTime, context.timezone);
    const slots = await this.deriveSlots(context, date, date);
    return slots.find(
      (slot) => slot.startTime.getTime() === startTime.getTime(),
    );
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
    const rangeStart = zonedDateTimeToUtc(from, '00:00', context.timezone);
    const rangeEnd = zonedDateTimeToUtc(
      addDays(to, 1),
      '00:00',
      context.timezone,
    );
    const appointments = await this.repository.findBlockingAppointments(
      context.service.advisorId,
      rangeStart,
      rangeEnd,
    );
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
      const specificRanges = context.specificWindows
        .filter((window) => window.availableDate === date)
        .map((window) => ({
          startTime: window.startTime,
          endTime: window.endTime,
        }));
      const weeklyRanges = context.weeklyWindows
        .filter((window) => window.dayOfWeek === isoWeekday(date))
        .map((window) => ({
          startTime: window.startTime,
          endTime: window.endTime,
        }));
      const source = mergeRanges([...weeklyRanges, ...specificRanges]);
      for (const range of source) {
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
            start.getTime() + context.global.slotIntervalMinutes * 60000,
          )
        ) {
          const end = new Date(
            start.getTime() + context.service.durationMinutes * 60000,
          );
          const unavailableUntil = new Date(
            end.getTime() + context.global.bufferMinutes * 60000,
          );
          if (end > rangeEnd || start < earliestStart || date > latestDate)
            continue;
          const overlapsBlockedPeriod = context.blockedPeriods.some(
            (period) => {
              if (period.blockedDate !== date) return false;
              if (!period.startTime || !period.endTime) return true;
              return overlaps(
                start,
                end,
                zonedDateTimeToUtc(date, period.startTime, context.timezone),
                zonedDateTimeToUtc(date, period.endTime, context.timezone),
              );
            },
          );
          if (
            overlapsBlockedPeriod ||
            appointments.some((appointment) =>
              overlaps(
                start,
                unavailableUntil,
                appointment.startTime,
                appointment.unavailableUntil,
              ),
            )
          )
            continue;
          if (context.global.dailyConsultationLimitMinutes !== null) {
            const used = appointments
              .filter(
                (appointment) =>
                  dateInTimeZone(appointment.startTime, context.timezone) ===
                  date,
              )
              .reduce(
                (total, appointment) =>
                  total +
                  (appointment.endTime.getTime() -
                    appointment.startTime.getTime()) /
                    60000,
                0,
              );
            if (
              used + context.service.durationMinutes >
              context.global.dailyConsultationLimitMinutes
            )
              continue;
          }
          if (context.service.dailyConsultationLimitMinutes !== null) {
            const serviceMinutesUsed = appointments
              .filter(
                (appointment) =>
                  appointment.serviceId === context.service.id &&
                  dateInTimeZone(appointment.startTime, context.timezone) ===
                    date,
              )
              .reduce(
                (total, appointment) =>
                  total +
                  (appointment.endTime.getTime() -
                    appointment.startTime.getTime()) /
                    60000,
                0,
              );
            if (
              serviceMinutesUsed + context.service.durationMinutes >
              context.service.dailyConsultationLimitMinutes
            )
              continue;
          }
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
    for (const window of dto.weeklyWindows)
      addRange(ranges, `weekly:${window.dayOfWeek}`, window);
    for (const window of dto.specificWindows ?? [])
      addRange(ranges, `specific:${window.availableDate}`, window);
    for (const [key, values] of ranges) {
      values.sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (
        values.some(
          (value, index) =>
            value.startTime >= value.endTime ||
            (index > 0 && values[index - 1].endTime > value.startTime),
        )
      )
        throw new BadRequestException(
          `${AVAILABILITY_MESSAGES.invalidWindows}: ${key}`,
        );
    }
    for (const period of dto.blockedPeriods ?? [])
      if (
        (period.startTime === undefined) !== (period.endTime === undefined) ||
        (period.startTime &&
          period.endTime &&
          period.startTime >= period.endTime)
      )
        throw new BadRequestException(AVAILABILITY_MESSAGES.invalidWindows);
    for (const window of [...dto.weeklyWindows, ...(dto.specificWindows ?? [])])
      if (!isSlotGridTime(window.startTime) || !isSlotGridTime(window.endTime))
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
