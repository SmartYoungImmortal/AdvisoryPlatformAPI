import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { JwtModule } from '@nestjs/jwt';
import { readFileSync } from 'fs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        privateKey: readFileSync(
          configService.getOrThrow<string>(
            ENV_KEYS.MEETINGS_JWT_SECRET_FILENAME,
          ),
        ),
        publicKey: readFileSync(
          configService.getOrThrow<string>(
            ENV_KEYS.MEETINGS_JWT_PUBLIC_FILENAME,
          ),
        ),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
