import { RoleResolver } from '@/common/authorization/role-resolver.service';
import { RoleRepository } from '@/common/authorization/role.repository';
import type { Env } from '@/config/env.schema';
import type { DrizzleDB } from '@/database/database.module';
import { DRIZZLE } from '@/database/database.module';
import { createAuth } from '@/modules/auth/auth.config';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule as ThallespAuthModule } from '@thallesp/nestjs-better-auth';

@Module({
  imports: [
    ThallespAuthModule.forRootAsync({
      imports: [NotificationsModule],
      inject: [DRIZZLE, ConfigService, NotificationsService],
      useFactory: (
        db: DrizzleDB,
        config: ConfigService<Env, true>,
        notifications: NotificationsService,
      ) => {
        const auth = createAuth(db, config, {
          // Every account starts with a welcome in its notification feed.
          onUserCreated: (user) => notifications.welcome(user.id),
        });
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
