import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StaticConfigService } from '@/config/static/static.service';

describe('MeetingsController', () => {
  let controller: MeetingsController;

  const mockJwtToken = 'mocked.jwt.token';
  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue(mockJwtToken),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [MeetingsController],
      providers: [
        MeetingsService,
        StaticConfigService,
        ConfigService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<MeetingsController>(MeetingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
