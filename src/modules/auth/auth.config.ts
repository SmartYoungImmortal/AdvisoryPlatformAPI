import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2';
import type { ConfigService } from '@nestjs/config';
import type { DrizzleDB } from '@/database/database.module';
import * as schema from '@/database/schema';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';
import { admin as adminPlugin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  userAc,
} from 'better-auth/plugins/admin/access';

const statements = {
  ...defaultStatements,
  profile: ['read', 'updateSelf', 'deleteSelf'],
  advisor: ['createSelf', 'read', 'updateSelf'],
  advisorService: ['createSelf', 'read', 'update', 'delete'],
  skills: ['create', 'read', 'update', 'delete'],
} as const;

const ac = createAccessControl(statements);
const adminStatements = {
  ...adminAc.statements,
  profile: ['read', 'updateSelf', 'deleteSelf'],
  skills: ['create', 'read', 'update', 'delete'],
} as const;
const advisorStatements = {
  ...userAc.statements,
  profile: ['read', 'updateSelf', 'deleteSelf'],
  advisor: ['createSelf', 'read', 'updateSelf'],
  advisorService: ['createSelf', 'read', 'update', 'delete'],
  skills: ['read', 'create'],
} as const;
const adviseeStatements = {
  ...userAc.statements,
  profile: ['read', 'updateSelf', 'deleteSelf'],
  advisor: ['createSelf', 'read'],
  advisorService: ['read'],
  skills: ['read'],
} as const;
const adminRole = ac.newRole(adminStatements);
const advisorRole = ac.newRole(advisorStatements);
const adviseeRole = ac.newRole(adviseeStatements);

export const appRoles = {
  admin: adminRole,
  advisor: advisorRole,
  advisee: adviseeRole,
};

/**
 * better-auth owns the `user` table's base fields (id, email, emailVerified, name, image,
 * createdAt, updatedAt). `fields.name` repoints better-auth's base "name" concept at our
 * `displayName` Drizzle property (the ER's "what everyone else sees" field) instead of
 * adding a redundant column. `image` is left unused in favor of a separate `avatarKey`
 * additionalField, matching the domain schema's four (fullName, avatarKey, timezone,
 * status) and this repo's `objectKey`-style naming for MinIO references.
 *
 * Note: `additionalFields[key].fieldName`, if set, must name the *Drizzle schema property*
 * (see @better-auth/core's getFieldName, which indexes straight into the passed-in Drizzle
 * schema object) — not the physical DB column. Since our Drizzle keys already match these
 * field names, no override is needed here.
 */
export function createAuth(db: DrizzleDB, config: ConfigService<Env, true>) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    secret: config.get(ENV_KEYS.BETTER_AUTH_SECRET, { infer: true }),
    baseURL: config.get(ENV_KEYS.BETTER_AUTH_URL, { infer: true }),
    trustedOrigins: config.get(ENV_KEYS.TRUSTED_ORIGINS, { infer: true }),
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      database: {
        // Repo-wide non-negotiable: uuid PKs everywhere, including better-auth's tables.
        generateId: () => crypto.randomUUID(),
      },
    },
    user: {
      fields: {
        name: 'displayName',
      },
      additionalFields: {
        fullName: {
          type: 'string',
          required: true,
        },
        avatarKey: {
          type: 'string',
          required: false,
          input: false,
        },
        timezone: {
          type: 'string',
          required: true,
        },
        status: {
          type: 'string',
          required: true,
          defaultValue: 'ACTIVE',
          input: false,
        },
      },
    },
    plugins: [
      adminPlugin({
        ac,
        roles: appRoles,
        defaultRole: 'advisee',
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthRoles = keyof typeof appRoles;
export type AuthSession = Auth['$Infer']['Session'];
export type SessionUser = AuthSession['user'];
export type AuthStatements = {
  [Resource in keyof typeof statements]?: Array<
    (typeof statements)[Resource][number]
  >;
};
export interface MemberHasPermissionOptions {
  permissions: AuthStatements;
}
