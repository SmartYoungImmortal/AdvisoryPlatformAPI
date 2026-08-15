import { Module } from '@nestjs/common';
import { JitsiTokenService } from './jitsi-token.service';
import { VideoController } from './video.controller';
import { VideoRepository } from './video.repository';
import { VideoService } from './video.service';

@Module({
  controllers: [VideoController],
  providers: [JitsiTokenService, VideoRepository, VideoService],
})
export class VideoModule {}
