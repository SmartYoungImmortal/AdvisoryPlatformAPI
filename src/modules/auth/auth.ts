import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2';
import * as schema from '@/database/schema';
import { ENV_KEYS } from '@/config/env.constants';
import { admin as adminPlugin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  userAc,
} from 'better-auth/plugins/admin/access';
import { drizzle } from 'drizzle-orm/node-postgres';

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

const db = drizzle(process.env.DATABASE_URL!);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: '',
  baseURL: '',
  trustedOrigins: '',
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
