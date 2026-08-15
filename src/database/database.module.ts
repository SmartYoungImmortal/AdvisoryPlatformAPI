import {
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ENV_KEYS } from '../config/env.constants';
import { Env } from '../config/env.schema';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_POOL = Symbol('PG_POOL');

export type DrizzleDB = NodePgDatabase<typeof schema>;

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
      useFactory: (config: ConfigService<Env, true>): Pool =>
        new Pool({
          connectionString: config.get(ENV_KEYS.DATABASE_URL, { infer: true }),
        }),
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool): DrizzleDB => drizzle(pool, { schema }),
    },
    DatabaseLifecycle,
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
