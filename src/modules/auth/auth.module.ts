import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Env } from '../../config/env.schema';
import { DRIZZLE, DrizzleDB } from '../../database/database.module';
import { RoleRepository } from '../../common/authorization/role.repository';
import { RoleResolver } from '../../common/authorization/role-resolver.service';
import { SessionGuard } from '../../common/guards/session.guard';
import { AuthController } from './auth.controller';
import { createAuth } from './auth.config';
import { AUTH } from './auth.constants';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    RoleRepository,
    RoleResolver,
    {
      provide: AUTH,
      inject: [DRIZZLE, ConfigService],
      useFactory: (db: DrizzleDB, config: ConfigService<Env, true>) =>
        createAuth(db, config),
    },
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
  ],
  exports: [AUTH, RoleResolver],
})
export class AuthModule {}
