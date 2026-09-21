export function assertIanaTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
  } catch {
    throw new RangeError(`Invalid IANA timezone: ${timeZone}`);
  }
}

export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day || 7;
}

export function dateInTimeZone(value: Date, timeZone: string): string {
  const parts = dateParts(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Converts an Advisor-local wall-clock time into the persisted UTC instant. */
export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second = 0] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = target;

  // An IANA zone's offset may change between the UTC guess and the target local time.
  // Re-evaluate the offset until the local wall-clock representation stabilizes.
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = dateParts(new Date(instant), timeZone);
    const actualAsUtc = Date.UTC(
      Number(actual.year),
      Number(actual.month) - 1,
      Number(actual.day),
      Number(actual.hour),
      Number(actual.minute),
      Number(actual.second),
    );
    const next = instant + (target - actualAsUtc);
    if (next === instant) break;
    instant = next;
  }

  const result = new Date(instant);
  const resolved = dateParts(result, timeZone);
  const expected = `${date}T${normaliseTime(time)}`;
  const actual = `${resolved.year}-${resolved.month}-${resolved.day}T${resolved.hour}:${resolved.minute}:${resolved.second}`;
  if (actual !== expected) {
    throw new RangeError(
      `The local time ${expected} does not exist in ${timeZone}`,
    );
  }
  return result;
}

interface ZonedDateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

function dateParts(value: Date, timeZone: string): ZonedDateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: byType.get('year')!,
    month: byType.get('month')!,
    day: byType.get('day')!,
    hour: byType.get('hour')!,
    minute: byType.get('minute')!,
    second: byType.get('second')!,
  };
}

function normaliseTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}
