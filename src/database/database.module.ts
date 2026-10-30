import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV_KEYS } from '@/config/env.constants';
import { Env } from '@/config/env.schema';
import { allRelations } from '@/database/schema/relations';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_POOL = Symbol('PG_POOL');

export type DrizzleDB = NodePgDatabase<typeof allRelations>;

const poolLogger = new Logger('DatabasePool');

@Injectable()
class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  onApplicationShutdown(): Promise<void> {
    return this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      /**
       * Connections are kept for five minutes idle, not `pg`'s default ten
       * seconds. Opening one to the Supabase pooler is TCP, TLS and auth across
       * the region — measured at ~0.9 s against ~0.1 s for a query on a warm
       * connection — so a ten-second idle window made the first request after
       * any pause pay that again. `keepAlive` stops a NAT or load balancer from
       * silently dropping the socket in between.
       *
       * A connection that dies while it sits idle (the pooler restarting, the
       * network dropping, the machine waking from sleep) is reported as the
       * pool's `error` event, and Node ends the whole process on an `error`
       * nobody listens for: the API went down overnight that way. The pool
       * has already discarded the dead client and opens a fresh one on the
       * next query, so the event is only logged.
       */
      useFactory: (config: ConfigService<Env, true>): Pool => {
        const pool = new Pool({
          connectionString: config.get(ENV_KEYS.DATABASE_URL, { infer: true }),
          idleTimeoutMillis: 5 * 60_000,
          keepAlive: true,
        });
        pool.on('error', (error) =>
          poolLogger.warn(`Idle database connection lost: ${error.message}`),
        );
        return pool;
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool): DrizzleDB =>
        drizzle({ client: pool, relations: allRelations }),
    },
    DatabaseLifecycle,
  ],
  // `@Global()` makes the module visible everywhere; it does not make an
  // unexported provider injectable. `PG_POOL` is exported alongside `DRIZZLE`
  // because the health check needs the pool itself to prove a connection can be
  // taken and released, which the query builder cannot express.
  exports: [DRIZZLE, PG_POOL],
})
export class DatabaseModule {}
