import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/** `PG_POOL` comes from the global `DatabaseModule`, so nothing is imported here. */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
