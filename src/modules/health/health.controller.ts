import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { HealthService } from './health.service';

/**
 * `GET /api/v1/health` — does this container have a working database connection.
 *
 * The Cloud Run workflow leaned on better-auth's `/api/auth/ok`, which is
 * deliberately chosen *not* to touch the database: it answers whether the process
 * booted, and nothing more. That is the right probe for "did the container start"
 * and the wrong one for "can this container serve a request", because the API is
 * useless without Supabase and a pool that cannot connect still answers `ok`.
 *
 * This route takes a connection out of the pool and runs one statement, so a
 * failure here means the thing a caller actually cares about is broken.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Liveness and database reachability',
    description:
      'Returns the process uptime and the round-trip time of a `select 1` against the configured database.',
  })
  @ResponseMessage('Healthy')
  check() {
    return this.health.check();
  }
}
