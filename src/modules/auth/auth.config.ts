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

const permissions = {
  profile: {
    selfManaged: ['read', 'updateSelf', 'deleteSelf'],
  },
  advisor: {
    selfManaged: ['createSelf', 'read', 'updateSelf'],
    selfCreateOrRead: ['createSelf', 'read'],
  },
  advisorService: {
    selfManaged: ['createSelf', 'read', 'update', 'delete'],
    readOnly: ['read'],
  },
  serviceCategory: {
    managed: ['create', 'read', 'update', 'delete'],
    readOnly: ['read'],
  },
  skills: {
    managed: ['create', 'read', 'update', 'delete'],
    readAndCreate: ['read', 'create'],
    readOnly: ['read'],
  },
  /**
   * The moderation surfaces. Each one is a queue an admin works through, so the
   * verb is `decide` rather than `update`: approving an identity, rejecting a
   * refund and resolving a report are all one irreversible ruling, and naming
   * them `update` would let a future role hold "can edit" without "can rule".
   *
   * An Advisor may `submit` their own identity and skill proofs and `read` the
   * outcome; only an admin decides. An Advisee may `submit` a refund request and
   * a report. Nobody but an admin reads another person's queue row.
   */
  identityVerification: {
    moderated: ['read', 'decide'],
    selfSubmit: ['submitSelf', 'readSelf'],
  },
  skillProof: {
    moderated: ['read', 'decide'],
    selfSubmit: ['submitSelf', 'readSelf'],
  },
  refund: {
    moderated: ['read', 'decide'],
    selfSubmit: ['submitSelf', 'readSelf'],
  },
  report: {
    moderated: ['read', 'decide'],
    selfSubmit: ['submitSelf', 'readSelf'],
  },
  offPlatformFlag: {
    moderated: ['read', 'decide'],
  },
  payout: {
    moderated: ['read', 'decide'],
    readSelf: ['readSelf'],
  },
  auditLog: {
    readOnly: ['read'],
  },
} as const;

const statements = {
  ...defaultStatements,
  profile: permissions.profile.selfManaged,
  advisor: permissions.advisor.selfManaged,
  advisorService: permissions.advisorService.selfManaged,
  serviceCategory: permissions.serviceCategory.managed,
  skills: permissions.skills.managed,
  // The union of every verb any role may hold on the moderation surfaces. A
  // statement absent here cannot be granted to anyone, so this list is the
  // vocabulary and the role blocks below are who speaks which part of it.
  identityVerification: [
    ...permissions.identityVerification.moderated,
    ...permissions.identityVerification.selfSubmit,
  ],
  skillProof: [
    ...permissions.skillProof.moderated,
    ...permissions.skillProof.selfSubmit,
  ],
  refund: [...permissions.refund.moderated, ...permissions.refund.selfSubmit],
  report: [...permissions.report.moderated, ...permissions.report.selfSubmit],
  offPlatformFlag: permissions.offPlatformFlag.moderated,
  payout: [...permissions.payout.moderated, ...permissions.payout.readSelf],
  auditLog: permissions.auditLog.readOnly,
} as const;

const ac = createAccessControl(statements);
const adminStatements = {
  ...adminAc.statements,
  profile: permissions.profile.selfManaged,
  advisorService: permissions.advisorService.readOnly,
  serviceCategory: permissions.serviceCategory.managed,
  skills: permissions.skills.managed,
  // An admin rules on every queue and reads the log. They deliberately hold no
  // `submitSelf`: an admin who could file the refund they then approve is the
  // one combination this split exists to prevent.
  identityVerification: permissions.identityVerification.moderated,
  skillProof: permissions.skillProof.moderated,
  refund: permissions.refund.moderated,
  report: permissions.report.moderated,
  offPlatformFlag: permissions.offPlatformFlag.moderated,
  payout: permissions.payout.moderated,
  auditLog: permissions.auditLog.readOnly,
} as const;
const advisorStatements = {
  ...userAc.statements,
  profile: permissions.profile.selfManaged,
  advisor: permissions.advisor.selfManaged,
  advisorService: permissions.advisorService.selfManaged,
  serviceCategory: permissions.serviceCategory.managed,
  skills: permissions.skills.readAndCreate,
  // An Advisor submits their own identity and proofs and watches the outcome,
  // and reads their own payouts. They never decide, and they never see another
  // Advisor's queue row.
  identityVerification: permissions.identityVerification.selfSubmit,
  skillProof: permissions.skillProof.selfSubmit,
  report: permissions.report.selfSubmit,
  payout: permissions.payout.readSelf,
} as const;
const adviseeStatements = {
  ...userAc.statements,
  profile: permissions.profile.selfManaged,
  advisor: permissions.advisor.selfCreateOrRead,
  advisorService: permissions.advisorService.readOnly,
  serviceCategory: permissions.serviceCategory.readOnly,
  skills: permissions.skills.readOnly,
  // An Advisee opens their own refund case and reports another user, and reads
  // back only their own. Defining the statement without granting it to anybody is
  // how `POST /api/v1/refunds` and `POST /api/v1/reports` come to 403 for the only
  // role that is supposed to call them.
  refund: permissions.refund.selfSubmit,
  report: permissions.report.selfSubmit,
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
 * status) and this repo's `objectKey`-style naming for SeaweedFS references.
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
