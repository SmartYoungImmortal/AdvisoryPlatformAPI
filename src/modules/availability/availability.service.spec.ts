import { BadRequestException } from '@nestjs/common';
import type { AvailabilityRepository } from './availability.repository';
import { AvailabilityService } from './availability.service';

type SchedulingContext = NonNullable<
  Awaited<ReturnType<AvailabilityRepository['schedulingContext']>>
>;
type BlockingAppointment = Awaited<
  ReturnType<AvailabilityRepository['findBlockingAppointments']>
>[number];

const advisorId = '11111111-1111-1111-1111-111111111111';
const adviseeId = '22222222-2222-2222-2222-222222222222';
const serviceId = '33333333-3333-3333-3333-333333333333';
const profileId = '44444444-4444-4444-4444-444444444444';
const categoryId = '55555555-5555-5555-5555-555555555555';
const appointmentId = '66666666-6666-6666-6666-666666666666';

function context(
  overrides: {
    screeningRequired?: boolean;
    globalLimit?: number | null;
    serviceLimit?: number | null;
    weeklyWindows?: SchedulingContext['weeklyWindows'];
    specificWindows?: SchedulingContext['specificWindows'];
    blockedPeriods?: SchedulingContext['blockedPeriods'];
  } = {},
): SchedulingContext {
  const timestamp = new Date('2026-08-29T00:00:00.000Z');
  return {
    timezone: 'Asia/Bangkok',
    service: {
      id: serviceId,
      advisorId,
      categoryId,
      availabilityProfileId: profileId,
      name: 'Career coaching',
      description: null,
      priceSatang: 150000,
      durationMinutes: 60,
      dailyConsultationLimitMinutes: overrides.serviceLimit ?? null,
      isPublished: true,
      screeningRequired: overrides.screeningRequired ?? false,
      trialEnabled: false,
      trialDurationMinutes: null,
      createdAt: timestamp,
      modifiedAt: timestamp,
    },
    global: {
      advisorId,
      slotIntervalMinutes: 30,
      bufferMinutes: 30,
      bookingHorizonDays: 60,
      minimumBookingNoticeMinutes: 0,
      dailyConsultationLimitMinutes: overrides.globalLimit ?? null,
      createdAt: timestamp,
      modifiedAt: timestamp,
    },
    weeklyWindows: overrides.weeklyWindows ?? [weeklyWindow('09:00', '12:00')],
    specificWindows: overrides.specificWindows ?? [],
    blockedPeriods: overrides.blockedPeriods ?? [],
  };
}

function weeklyWindow(
  startTime: string,
  endTime: string,
): SchedulingContext['weeklyWindows'][number] {
  return {
    id: crypto.randomUUID(),
    availabilityProfileId: profileId,
    dayOfWeek: 1,
    startTime,
    endTime,
  };
}

function appointment(
  startTime: string,
  endTime: string,
  unavailableUntil = endTime,
  bookedServiceId = serviceId,
): BlockingAppointment {
  const timestamp = new Date('2026-08-29T00:00:00.000Z');
  return {
    id: appointmentId,
    serviceId: bookedServiceId,
    advisorId,
    adviseeId,
    type: 'CONSULTATION',
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    unavailableUntil: new Date(unavailableUntil),
    blocksAvailability: true,
    cancelledByUserId: null,
    cancelledAt: null,
    chatRoomId: null,
    jitsiRoomName: null,
    state: 'BOOKED',
    createdAt: timestamp,
    modifiedAt: timestamp,
  };
}

describe('AvailabilityService slot derivation', () => {
  let service: AvailabilityService;
  let repository: jest.Mocked<
    Pick<
      AvailabilityRepository,
      'schedulingContext' | 'findBlockingAppointments' | 'hasAcceptedScreening'
    >
  >;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T00:00:00.000Z'));
    repository = {
      schedulingContext: jest.fn(),
      findBlockingAppointments: jest.fn().mockResolvedValue([]),
      hasAcceptedScreening: jest.fn().mockResolvedValue(true),
    };
    service = new AvailabilityService(
      repository as unknown as AvailabilityRepository,
    );
  });

  afterEach(() => jest.useRealTimers());

  it('interprets profile wall times in the Advisor timezone and returns UTC instants', async () => {
    repository.schedulingContext.mockResolvedValue(context());

    const slots = await service.findSlots(
      serviceId,
      { from: '2026-09-07', to: '2026-09-07' },
      adviseeId,
    );

    expect(slots.map((slot) => slot.startTime.toISOString())).toEqual([
      '2026-09-07T02:00:00.000Z',
      '2026-09-07T02:30:00.000Z',
      '2026-09-07T03:00:00.000Z',
      '2026-09-07T03:30:00.000Z',
      '2026-09-07T04:00:00.000Z',
    ]);
  });

  it('combines weekly and specific-date availability without duplicate slots', async () => {
    const scheduling = context({
      weeklyWindows: [weeklyWindow('09:00', '10:00')],
      specificWindows: [
        {
          id: crypto.randomUUID(),
          availabilityProfileId: profileId,
          availableDate: '2026-09-07',
          startTime: '09:30',
          endTime: '12:00',
        },
      ],
    });
    repository.schedulingContext.mockResolvedValue(scheduling);

    const slots = await service.findSlots(
      serviceId,
      { from: '2026-09-07', to: '2026-09-07' },
      adviseeId,
    );

    expect(slots).toHaveLength(5);
  });

  it('applies the candidate buffer before a later appointment', async () => {
    repository.schedulingContext.mockResolvedValue(context());
    repository.findBlockingAppointments.mockResolvedValue([
      appointment(
        '2026-09-07T04:00:00.000Z',
        '2026-09-07T05:00:00.000Z',
        '2026-09-07T05:30:00.000Z',
      ),
    ]);

    const slots = await service.findSlots(
      serviceId,
      { from: '2026-09-07', to: '2026-09-07' },
      adviseeId,
    );

    expect(slots.map((slot) => slot.startTime.toISOString())).toEqual([
      '2026-09-07T02:00:00.000Z',
      '2026-09-07T02:30:00.000Z',
    ]);
  });

  it('counts consultation time but not buffer against the service daily limit', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ serviceLimit: 120 }),
    );
    repository.findBlockingAppointments.mockResolvedValue([
      appointment(
        '2026-09-06T23:00:00.000Z',
        '2026-09-07T00:00:00.000Z',
        '2026-09-07T00:30:00.000Z',
      ),
      appointment(
        '2026-09-07T00:30:00.000Z',
        '2026-09-07T01:30:00.000Z',
        '2026-09-07T02:00:00.000Z',
      ),
    ]);

    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-09-07', to: '2026-09-07' },
        adviseeId,
      ),
    ).resolves.toEqual([]);
  });

  it('requires accepted screening before exposing slots for a screened service', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ screeningRequired: true }),
    );
    repository.hasAcceptedScreening.mockResolvedValue(false);

    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-09-07', to: '2026-09-07' },
        adviseeId,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(repository.findBlockingAppointments).not.toHaveBeenCalled();
  });

  it('rejects impossible dates and ranges longer than 90 inclusive days', async () => {
    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-02-30', to: '2026-03-01' },
        adviseeId,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-01-01', to: '2026-04-01' },
        adviseeId,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(repository.schedulingContext).not.toHaveBeenCalled();
  });
});
