import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AvailabilityRepository } from './availability.repository';
import { AvailabilityService } from './availability.service';
import type { AvailabilityProfileDetails } from './availability.types';
import type { UpsertAvailabilityProfileDto } from './dtos/availability.dto';

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
const otherServiceId = '77777777-7777-7777-7777-777777777777';

function context(
  overrides: {
    screeningRequired?: boolean;
    globalLimit?: number | null;
    serviceLimit?: number | null;
    timezone?: string;
    noticeMinutes?: number;
    horizonDays?: number;
    weeklyWindows?: SchedulingContext['weeklyWindows'];
    specificWindows?: SchedulingContext['specificWindows'];
    blockedPeriods?: SchedulingContext['blockedPeriods'];
  } = {},
): SchedulingContext {
  const timestamp = new Date('2026-08-29T00:00:00.000Z');
  return {
    timezone: overrides.timezone ?? 'Asia/Bangkok',
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
      bookingHorizonDays: overrides.horizonDays ?? 60,
      minimumBookingNoticeMinutes: overrides.noticeMinutes ?? 0,
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
  dayOfWeek = 1,
): SchedulingContext['weeklyWindows'][number] {
  return {
    id: crypto.randomUUID(),
    availabilityProfileId: profileId,
    dayOfWeek,
    startTime,
    endTime,
  };
}

function blockedPeriod(
  blockedDate: string,
  startTime: string | null = null,
  endTime: string | null = null,
): SchedulingContext['blockedPeriods'][number] {
  return {
    id: crypto.randomUUID(),
    availabilityProfileId: profileId,
    blockedDate,
    startTime,
    endTime,
    createdAt: new Date('2026-08-29T00:00:00.000Z'),
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

function profileDetails(): AvailabilityProfileDetails {
  const timestamp = new Date('2026-08-29T00:00:00.000Z');
  return {
    profile: {
      id: profileId,
      advisorId,
      name: 'Weekday mornings',
      deletedAt: null,
      createdAt: timestamp,
      modifiedAt: timestamp,
    },
    weeklyWindows: [],
    specificWindows: [],
    blockedPeriods: [],
  };
}

function upsertDto(
  overrides: Partial<UpsertAvailabilityProfileDto> = {},
): UpsertAvailabilityProfileDto {
  return {
    name: 'Weekday mornings',
    weeklyWindows: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
    ...overrides,
  };
}

type AvailabilityRepositoryMock = jest.Mocked<
  Pick<
    AvailabilityRepository,
    | 'schedulingContext'
    | 'findBlockingAppointments'
    | 'hasAcceptedScreening'
    | 'findGlobal'
    | 'upsertGlobal'
    | 'findProfiles'
    | 'saveProfile'
    | 'findOwnedProfile'
    | 'softDelete'
  >
>;

function makeService(): {
  service: AvailabilityService;
  repository: AvailabilityRepositoryMock;
} {
  const repository: AvailabilityRepositoryMock = {
    schedulingContext: jest.fn(),
    findBlockingAppointments: jest.fn().mockResolvedValue([]),
    hasAcceptedScreening: jest.fn().mockResolvedValue(true),
    findGlobal: jest.fn(),
    upsertGlobal: jest.fn(),
    findProfiles: jest.fn(),
    saveProfile: jest.fn(),
    findOwnedProfile: jest.fn(),
    softDelete: jest.fn(),
  };
  return {
    repository,
    service: new AvailabilityService(
      repository as unknown as AvailabilityRepository,
    ),
  };
}

describe('AvailabilityService slot derivation', () => {
  let service: AvailabilityService;
  let repository: AvailabilityRepositoryMock;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T00:00:00.000Z'));
    ({ service, repository } = makeService());
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

  it('keeps the wider window when one range fully contains another', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({
        weeklyWindows: [
          weeklyWindow('09:00', '12:00'),
          weeklyWindow('10:00', '11:00'),
        ],
      }),
    );

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

  it('counts every Service against the global daily limit', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ globalLimit: 120 }),
    );
    repository.findBlockingAppointments.mockResolvedValue([
      appointment(
        '2026-09-06T23:00:00.000Z',
        '2026-09-07T01:00:00.000Z',
        '2026-09-07T01:00:00.000Z',
        otherServiceId,
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

  it('leaves the global limit alone when another Service has not filled it', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ globalLimit: 240 }),
    );
    repository.findBlockingAppointments.mockResolvedValue([
      appointment(
        '2026-09-06T23:00:00.000Z',
        '2026-09-07T01:00:00.000Z',
        '2026-09-07T01:00:00.000Z',
        otherServiceId,
      ),
    ]);

    const slots = await service.findSlots(
      serviceId,
      { from: '2026-09-07', to: '2026-09-07' },
      adviseeId,
    );

    expect(slots).toHaveLength(5);
  });

  it('removes every slot on a full-day blocked period', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ blockedPeriods: [blockedPeriod('2026-09-07')] }),
    );

    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-09-07', to: '2026-09-07' },
        adviseeId,
      ),
    ).resolves.toEqual([]);
  });

  it('removes only the overlapping slots of a partial blocked period', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({
        blockedPeriods: [blockedPeriod('2026-09-07', '09:00', '10:00')],
      }),
    );

    const slots = await service.findSlots(
      serviceId,
      { from: '2026-09-07', to: '2026-09-07' },
      adviseeId,
    );

    expect(slots.map((slot) => slot.startTime.toISOString())).toEqual([
      '2026-09-07T03:00:00.000Z',
      '2026-09-07T03:30:00.000Z',
      '2026-09-07T04:00:00.000Z',
    ]);
  });

  it('ignores a blocked period recorded for a different date', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ blockedPeriods: [blockedPeriod('2026-09-08')] }),
    );

    const slots = await service.findSlots(
      serviceId,
      { from: '2026-09-07', to: '2026-09-07' },
      adviseeId,
    );

    expect(slots).toHaveLength(5);
  });

  it('hides slots that fall inside the minimum booking notice', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ noticeMinutes: 8820 }),
    );

    const slots = await service.findSlots(
      serviceId,
      { from: '2026-09-07', to: '2026-09-07' },
      adviseeId,
    );

    expect(slots.map((slot) => slot.startTime.toISOString())).toEqual([
      '2026-09-07T03:00:00.000Z',
      '2026-09-07T03:30:00.000Z',
      '2026-09-07T04:00:00.000Z',
    ]);
  });

  it('hides slots beyond the booking horizon', async () => {
    repository.schedulingContext.mockResolvedValue(context());

    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-11-02', to: '2026-11-02' },
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

  it('reports an unknown or unpublished Service as not found', async () => {
    repository.schedulingContext.mockResolvedValue(undefined);

    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-09-07', to: '2026-09-07' },
        adviseeId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an Advisor timezone that is not a real IANA zone', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ timezone: 'Not/AZone' }),
    );

    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-09-07', to: '2026-09-07' },
        adviseeId,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a window whose local start time is skipped by daylight saving', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({
        timezone: 'America/New_York',
        weeklyWindows: [weeklyWindow('02:00', '04:00', 7)],
      }),
    );

    await expect(
      service.findSlots(
        serviceId,
        { from: '2026-03-08', to: '2026-03-08' },
        adviseeId,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('AvailabilityService.findSlotAt', () => {
  let service: AvailabilityService;
  let repository: AvailabilityRepositoryMock;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T00:00:00.000Z'));
    ({ service, repository } = makeService());
    repository.schedulingContext.mockResolvedValue(context());
  });

  afterEach(() => jest.useRealTimers());

  it('returns the derived slot that starts on the requested instant', async () => {
    const slot = await service.findSlotAt(
      serviceId,
      new Date('2026-09-07T02:00:00.000Z'),
      adviseeId,
    );

    expect(slot?.endTime.toISOString()).toBe('2026-09-07T03:00:00.000Z');
  });

  it('returns nothing for an instant that is not on the slot grid', async () => {
    await expect(
      service.findSlotAt(
        serviceId,
        new Date('2026-09-07T02:15:00.000Z'),
        adviseeId,
      ),
    ).resolves.toBeUndefined();
  });

  it('enforces screening before resolving a single slot', async () => {
    repository.schedulingContext.mockResolvedValue(
      context({ screeningRequired: true }),
    );
    repository.hasAcceptedScreening.mockResolvedValue(false);

    await expect(
      service.findSlotAt(
        serviceId,
        new Date('2026-09-07T02:00:00.000Z'),
        adviseeId,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('AvailabilityService global availability', () => {
  let service: AvailabilityService;
  let repository: AvailabilityRepositoryMock;

  beforeEach(() => {
    ({ service, repository } = makeService());
  });

  it('returns the Advisor global record', async () => {
    const global = context().global;
    repository.findGlobal.mockResolvedValue(global);

    await expect(service.getGlobal(advisorId)).resolves.toBe(global);
  });

  it('reports a missing global record rather than defaulting one', async () => {
    repository.findGlobal.mockResolvedValue(undefined);

    await expect(service.getGlobal(advisorId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('delegates the upsert to the repository', async () => {
    const global = context().global;
    repository.upsertGlobal.mockResolvedValue(global);

    await expect(
      service.upsertGlobal(advisorId, { bufferMinutes: 15 }),
    ).resolves.toBe(global);
    expect(repository.upsertGlobal).toHaveBeenCalledWith(advisorId, {
      bufferMinutes: 15,
    });
  });
});

describe('AvailabilityService profiles', () => {
  let service: AvailabilityService;
  let repository: AvailabilityRepositoryMock;

  beforeEach(() => {
    ({ service, repository } = makeService());
  });

  it('lists the Advisor profiles', async () => {
    const details = [profileDetails()];
    repository.findProfiles.mockResolvedValue(details);

    await expect(service.findProfiles(advisorId)).resolves.toBe(details);
  });

  it('creates a profile whose windows pass validation', async () => {
    const details = profileDetails();
    repository.saveProfile.mockResolvedValue(details);
    const dto = upsertDto({
      specificWindows: [
        { availableDate: '2026-09-08', startTime: '13:00', endTime: '15:00' },
      ],
      blockedPeriods: [
        { blockedDate: '2026-09-09', startTime: '09:00', endTime: '10:00' },
        { blockedDate: '2026-09-10' },
      ],
    });

    await expect(service.createProfile(advisorId, dto)).resolves.toBe(details);
    expect(repository.saveProfile).toHaveBeenCalledWith(
      advisorId,
      undefined,
      dto,
    );
  });

  it('updates a profile the Advisor owns', async () => {
    const details = profileDetails();
    repository.findOwnedProfile.mockResolvedValue(details.profile);
    repository.saveProfile.mockResolvedValue(details);

    await expect(
      service.updateProfile(advisorId, profileId, upsertDto()),
    ).resolves.toBe(details);
    expect(repository.saveProfile).toHaveBeenCalledWith(
      advisorId,
      profileId,
      expect.anything(),
    );
  });

  it('refuses to update a profile the Advisor does not own', async () => {
    repository.findOwnedProfile.mockResolvedValue(undefined);

    await expect(
      service.updateProfile(advisorId, profileId, upsertDto()),
    ).rejects.toThrow(NotFoundException);
    expect(repository.saveProfile).not.toHaveBeenCalled();
  });

  it('soft-deletes a profile the Advisor owns', async () => {
    const details = profileDetails();
    repository.softDelete.mockResolvedValue(details);

    await expect(service.deleteProfile(advisorId, profileId)).resolves.toBe(
      details,
    );
  });

  it('reports a missing profile on delete', async () => {
    repository.softDelete.mockResolvedValue(undefined);

    await expect(service.deleteProfile(advisorId, profileId)).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('window validation', () => {
    it.each([
      [
        'a weekly window that ends before it starts',
        upsertDto({
          weeklyWindows: [
            { dayOfWeek: 1, startTime: '12:00', endTime: '09:00' },
          ],
        }),
      ],
      [
        'two overlapping weekly windows on one day',
        upsertDto({
          weeklyWindows: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '11:00' },
            { dayOfWeek: 1, startTime: '10:00', endTime: '12:00' },
          ],
        }),
      ],
      [
        'two overlapping specific-date windows',
        upsertDto({
          specificWindows: [
            {
              availableDate: '2026-09-08',
              startTime: '09:00',
              endTime: '11:00',
            },
            {
              availableDate: '2026-09-08',
              startTime: '10:00',
              endTime: '12:00',
            },
          ],
        }),
      ],
      [
        'a blocked period with a start but no end',
        upsertDto({
          blockedPeriods: [{ blockedDate: '2026-09-09', startTime: '09:00' }],
        }),
      ],
      [
        'a blocked period that ends before it starts',
        upsertDto({
          blockedPeriods: [
            { blockedDate: '2026-09-09', startTime: '10:00', endTime: '09:00' },
          ],
        }),
      ],
      [
        'a weekly window off the 30-minute grid',
        upsertDto({
          weeklyWindows: [
            { dayOfWeek: 1, startTime: '09:15', endTime: '10:15' },
          ],
        }),
      ],
    ])('rejects %s', async (_case, dto) => {
      await expect(service.createProfile(advisorId, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.saveProfile).not.toHaveBeenCalled();
    });

    it('accepts windows on different days that would overlap on one day', async () => {
      const details = profileDetails();
      repository.saveProfile.mockResolvedValue(details);

      await expect(
        service.createProfile(
          advisorId,
          upsertDto({
            weeklyWindows: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '11:00' },
              { dayOfWeek: 2, startTime: '09:00', endTime: '11:00' },
            ],
          }),
        ),
      ).resolves.toBe(details);
    });
  });
});
