import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import * as schema from '@/database/schema';
import { UsersRepository } from './users.repository';

describe('UsersRepository (integration)', () => {
  const missingUserId = '00000000-0000-4000-8000-000000000000';
  let pool: Pool;
  let repository: UsersRepository;

  beforeAll(() => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db: DrizzleDB = drizzle(pool, { schema });
    repository = new UsersRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('returns undefined when removing an avatar from a missing user', async () => {
    await expect(
      repository.removeAvatar(missingUserId),
    ).resolves.toBeUndefined();
  });

  it('returns undefined when anonymizing a missing user', async () => {
    await expect(
      repository.anonymizeById(missingUserId),
    ).resolves.toBeUndefined();
  });
});
