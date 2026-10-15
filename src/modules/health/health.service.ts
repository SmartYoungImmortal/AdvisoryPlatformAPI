import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '@/database/database.module';

/** What a healthy container reports. */
export interface HealthReport {
  readonly status: 'ok';
  /** Seconds this process has been up, whole. */
  readonly uptimeSeconds: number;
  /** Milliseconds the `select 1` round trip took, whole. */
  readonly databaseLatencyMs: number;
}

@Injectable()
export class HealthService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * One statement, one connection, returned to the pool either way.
   *
   * A 503 rather than a 500: the process is fine, the dependency is not, and a
   * container orchestrator reads those two differently. The cause is attached
   * because the failures worth telling apart here all surface as a `pg` error
   * code — `ENETUNREACH` when a container cannot route to the host at all,
   * `SELF_SIGNED_CERT_IN_CHAIN` when the connection string lost
   * `uselibpqcompat=true`, `ETIMEDOUT` when it is reaching the wrong port.
   */
  async check(): Promise<HealthReport> {
    const startedAt = Date.now();
    try {
      const client = await this.pool.connect();
      try {
        await client.query('select 1');
      } finally {
        client.release();
      }
    } catch (cause) {
      throw new ServiceUnavailableException({
        message: 'The database is not reachable from this container',
        cause: cause instanceof Error ? cause.message : String(cause),
      });
    }

    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      databaseLatencyMs: Date.now() - startedAt,
    };
  }
}
