import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MeetingsService } from './meetings.service';
import { StaticConfigService } from '@/config/static/static.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ENV_KEYS } from '@/config/env.constants';
import type { SessionUser } from '@/modules/auth/auth.config';

describe('MeetingsService', () => {
  let service: MeetingsService;
  let configService: ConfigService;
  let jwtService: JwtService;

  const mockSystemTime = new Date('2024-01-01T12:00:00Z');
  const mockRoom = 'test-room-123';
  const mockJitsiDomain = 'meet.example.com';
  const mockJwtToken = 'mocked.jwt.token';
  const mockMeetingLink =
    'https://meet.example.com/test-room-123?jwt=mocked.jwt.token';

  const mockSessionUser = {
    avatarKey: 'avatar-uuid.png',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
  } as SessionUser;

  const mockStaticConfigService = {
    config: {
      meetings: {
        jwt: {
          primitive: {
            iss: 'advisoryplatform.backend',
            aud: 'advisoryplatform.jitsi',
          },
          tokenExpiryGraceMs: 1000 * 60 * 10,
          algotithm: 'ES256',
        },
      },
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === ENV_KEYS.MEETINGS_JITSI_DOMAIN) {
        return mockJitsiDomain;
      }
      return null;
    }),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue(mockJwtToken),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        { provide: StaticConfigService, useValue: mockStaticConfigService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();

    jest.useFakeTimers();
    jest.setSystemTime(mockSystemTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getMeetingTokenPayload', () => {
    it('should correctly construct and return the JWT payload', () => {
      const result = service.getMeetingTokenPayload(mockSessionUser, mockRoom);

      expect(configService.get).toHaveBeenCalledWith(
        ENV_KEYS.MEETINGS_JITSI_DOMAIN,
        { infer: true },
      );

      expect(result).toEqual({
        ...mockStaticConfigService.config.meetings.jwt.primitive,
        sub: mockJitsiDomain,
        room: mockRoom,
        context: {
          user: {
            avatar: mockSessionUser.avatarKey,
            name: mockSessionUser.fullName,
            email: mockSessionUser.email,
          },
        },
      });
    });
  });

  describe('getMeetingToken', () => {
    it('should correctly generate and return a signed JWT token with the right timing options', async () => {
      const result = await service.getMeetingToken(mockSessionUser, mockRoom);

      const expectedMeetingEndTimeMs = mockSystemTime.valueOf() + 60 * 60;
      const expectedNotBefore =
        expectedMeetingEndTimeMs +
        mockStaticConfigService.config.meetings.jwt.tokenExpiryGraceMs;

      expect(result).toBe(mockJwtToken);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        service.getMeetingTokenPayload(mockSessionUser, mockRoom),
        { notBefore: expectedNotBefore },
      );
    });
  });

  describe('getMeetingUrl', () => {
    it('should correctly generate url with the correct room and jwt', async () => {
      service.getMeetingToken = jest.fn().mockResolvedValue(mockJwtToken);
      const result = await service.getMeetingUrl(mockSessionUser, mockRoom);

      expect(result).toBe(mockMeetingLink);

      expect(service.getMeetingToken).toHaveBeenCalledTimes(1);
      expect(service.getMeetingToken).toHaveBeenCalledWith(
        mockSessionUser,
        mockRoom,
      );
    });
  });
});
