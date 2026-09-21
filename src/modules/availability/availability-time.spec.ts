import {
  addDays,
  dateInTimeZone,
  isoWeekday,
  zonedDateTimeToUtc,
} from './availability-time';

describe('availability time conversion', () => {
  it('converts Advisor-local Bangkok availability to a UTC instant', () => {
    expect(
      zonedDateTimeToUtc('2026-09-01', '09:00', 'Asia/Bangkok').toISOString(),
    ).toBe('2026-09-01T02:00:00.000Z');
  });

  it('gets the local calendar date for a UTC booking instant', () => {
    expect(
      dateInTimeZone(
        new Date('2026-09-01T00:30:00.000Z'),
        'America/Los_Angeles',
      ),
    ).toBe('2026-08-31');
  });

  it('handles civil-date boundaries without depending on the server timezone', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(isoWeekday('2026-09-01')).toBe(2);
  });

  it('rejects a local wall-clock time skipped by daylight saving time', () => {
    expect(() =>
      zonedDateTimeToUtc('2026-03-08', '02:30', 'America/New_York'),
    ).toThrow(RangeError);
  });
});
