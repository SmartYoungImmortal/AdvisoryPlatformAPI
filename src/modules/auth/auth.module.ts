import { RoleResolver } from '@/common/authorization/role-resolver.service';
import { RoleRepository } from '@/common/authorization/role.repository';
import type { Env } from '@/config/env.schema';
import type { DrizzleDB } from '@/database/database.module';
import { DRIZZLE } from '@/database/database.module';
import { createAuth } from '@/modules/auth/auth.config';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule as ThallespAuthModule } from '@thallesp/nestjs-better-auth';

@Module({
  imports: [
    ThallespAuthModule.forRootAsync({
      inject: [DRIZZLE, ConfigService],
      useFactory: (db: DrizzleDB, config: ConfigService<Env, true>) => {
        const auth = createAuth(db, config);
        return {
          auth,
          bodyParser: {
            json: { limit: '2mb' },
            urlencoded: { limit: '2mb', extended: true },
            rawBody: true,
          },
        };
      },
    }),
  ],
  providers: [RoleRepository, RoleResolver],
  exports: [RoleResolver],
})
export class AuthModule {}
