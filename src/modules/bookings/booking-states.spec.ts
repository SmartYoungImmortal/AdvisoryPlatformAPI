import {
  ALLOWED_SOURCE_STATES,
  canTransition,
  reopensAvailability,
  type AppointmentState,
} from './booking-states';

const everyState: AppointmentState[] = [
  'PENDING_PAYMENT',
  'BOOKED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

describe('booking state transitions', () => {
  it.each([
    ['PENDING_PAYMENT', 'BOOKED'],
    ['PENDING_PAYMENT', 'CANCELLED'],
    ['BOOKED', 'CANCELLED'],
    ['BOOKED', 'IN_PROGRESS'],
    ['BOOKED', 'NO_SHOW'],
    ['IN_PROGRESS', 'COMPLETED'],
  ] as const)('allows %s to %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ['PENDING_PAYMENT', 'IN_PROGRESS'],
    ['PENDING_PAYMENT', 'COMPLETED'],
    ['PENDING_PAYMENT', 'NO_SHOW'],
    ['BOOKED', 'BOOKED'],
    ['BOOKED', 'COMPLETED'],
    ['IN_PROGRESS', 'CANCELLED'],
    ['IN_PROGRESS', 'NO_SHOW'],
  ] as const)('rejects %s to %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it.each(['COMPLETED', 'CANCELLED', 'NO_SHOW'] as const)(
    'treats %s as terminal',
    (terminal) => {
      const reachable = Object.keys(ALLOWED_SOURCE_STATES).filter((target) =>
        canTransition(terminal, target as keyof typeof ALLOWED_SOURCE_STATES),
      );
      expect(reachable).toEqual([]);
    },
  );

  it('never lists a source state outside the enum', () => {
    for (const sources of Object.values(ALLOWED_SOURCE_STATES))
      for (const source of sources) expect(everyState).toContain(source);
  });
});

describe('reopensAvailability', () => {
  const startTime = new Date('2026-09-20T10:00:00.000Z');

  it('reopens the range when more than the minimum notice remains', () => {
    const cancelledAt = new Date('2026-09-20T07:00:00.000Z');
    expect(reopensAvailability(startTime, cancelledAt, 120)).toBe(true);
  });

  it('reopens the range when exactly the minimum notice remains', () => {
    const cancelledAt = new Date('2026-09-20T08:00:00.000Z');
    expect(reopensAvailability(startTime, cancelledAt, 120)).toBe(true);
  });

  it('keeps the range blocked inside the minimum notice', () => {
    const cancelledAt = new Date('2026-09-20T09:30:00.000Z');
    expect(reopensAvailability(startTime, cancelledAt, 120)).toBe(false);
  });

  it('keeps the range blocked once the appointment has started', () => {
    const cancelledAt = new Date('2026-09-20T10:30:00.000Z');
    expect(reopensAvailability(startTime, cancelledAt, 0)).toBe(false);
  });

  it('reopens any not-yet-started range when no notice is configured', () => {
    const cancelledAt = new Date('2026-09-20T09:59:00.000Z');
    expect(reopensAvailability(startTime, cancelledAt, 0)).toBe(true);
  });
});
