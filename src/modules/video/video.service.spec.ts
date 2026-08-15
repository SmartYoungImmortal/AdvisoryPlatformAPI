import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { JitsiTokenService } from './jitsi-token.service';
import type {
  VideoAppointmentAccess,
  VideoRepository,
} from './video.repository';
import { VideoService } from './video.service';

const appointmentId = '11111111-1111-4111-8111-111111111111';
const user: SessionUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'advisee@example.test',
  emailVerified: false,
  name: 'Advisee',
  image: null,
  status: 'ACTIVE',
  fullName: 'Advisee Example',
  timezone: 'Asia/Bangkok',
  avatarKey: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function appointment(
  overrides: Partial<VideoAppointmentAccess> = {},
): VideoAppointmentAccess {
  return {
    id: appointmentId,
    state: 'BOOKED',
    jitsiRoomName: 'appointment-existing-room',
    startTime: new Date('2026-08-15T10:00:00Z'),
    endTime: new Date('2026-08-15T11:00:00Z'),
    ...overrides,
  };
}

function configService(): ConfigService<Env, true> {
  return {
    get: jest.fn(() => 15),
  } as unknown as ConfigService<Env, true>;
}

describe('VideoService', () => {
  let service: VideoService;
  let repository: jest.Mocked<
    Pick<VideoRepository, 'findForParticipant' | 'assignRoomNameIfMissing'>
  >;
  let tokenService: jest.Mocked<Pick<JitsiTokenService, 'signAccessToken'>> & {
    domain: string;
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-15T10:00:00Z'));
    repository = {
      findForParticipant: jest.fn(),
      assignRoomNameIfMissing: jest.fn(),
    };
    tokenService = {
      domain: 'meet.example.test',
      signAccessToken: jest.fn().mockResolvedValue('signed-jitsi-token'),
    };
    service = new VideoService(
      repository as unknown as VideoRepository,
      tokenService as unknown as JitsiTokenService,
      configService(),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns room-scoped access during the appointment window', async () => {
    repository.findForParticipant.mockResolvedValue(appointment());

    await expect(service.getAccess(appointmentId, user)).resolves.toEqual({
      roomName: 'appointment-existing-room',
      domain: 'meet.example.test',
      token: 'signed-jitsi-token',
      expiresAt: new Date('2026-08-15T11:15:00Z'),
    });
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      roomName: 'appointment-existing-room',
      userId: user.id,
      displayName: user.name,
      notBefore: new Date('2026-08-15T09:45:00Z'),
      expiresAt: new Date('2026-08-15T11:15:00Z'),
    });
    expect(repository.assignRoomNameIfMissing).not.toHaveBeenCalled();
  });

  it('atomically assigns an unpredictable room name when missing', async () => {
    repository.findForParticipant.mockResolvedValue(
      appointment({ jitsiRoomName: null }),
    );
    repository.assignRoomNameIfMissing.mockImplementation((_id, candidate) =>
      Promise.resolve(candidate),
    );

    const result = await service.getAccess(appointmentId, user);

    expect(result.roomName).toMatch(/^appointment-[a-f0-9]{32}$/);
    expect(repository.assignRoomNameIfMissing).toHaveBeenCalledWith(
      appointmentId,
      result.roomName,
    );
  });

  it.each([
    ['missing or unauthorized', undefined],
    ['pending payment', appointment({ state: 'PENDING_PAYMENT' })],
    ['cancelled', appointment({ state: 'CANCELLED' })],
    ['completed', appointment({ state: 'COMPLETED' })],
    ['no show', appointment({ state: 'NO_SHOW' })],
  ])('hides %s access behind not found', async (_case, access) => {
    repository.findForParticipant.mockResolvedValue(access);

    await expect(service.getAccess(appointmentId, user)).rejects.toThrow(
      NotFoundException,
    );
    expect(tokenService.signAccessToken).not.toHaveBeenCalled();
  });

  it('rejects access before the buffer and at or after expiry', async () => {
    repository.findForParticipant.mockResolvedValue(appointment());
    jest.setSystemTime(new Date('2026-08-15T09:44:59.999Z'));
    await expect(service.getAccess(appointmentId, user)).rejects.toThrow(
      NotFoundException,
    );

    jest.setSystemTime(new Date('2026-08-15T11:15:00Z'));
    await expect(service.getAccess(appointmentId, user)).rejects.toThrow(
      NotFoundException,
    );
    expect(tokenService.signAccessToken).not.toHaveBeenCalled();
  });

  it('reports an unavailable room without issuing a token', async () => {
    repository.findForParticipant.mockResolvedValue(
      appointment({ jitsiRoomName: null }),
    );
    repository.assignRoomNameIfMissing.mockResolvedValue(undefined);

    await expect(service.getAccess(appointmentId, user)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(tokenService.signAccessToken).not.toHaveBeenCalled();
  });
});
