import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import { relations } from '@/database/relations';
import { pdpaConsents, user } from '@/database/schema';
import { CompositeKeyStore } from './composite-key.store';

describe('CompositeKeyStore (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let store: CompositeKeyStore<
    typeof pdpaConsents,
    {
      readonly userId: typeof pdpaConsents.userId;
      readonly policyVersion: typeof pdpaConsents.policyVersion;
    }
  >;
  const userId = crypto.randomUUID();

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, relations });
    store = new CompositeKeyStore(db, pdpaConsents, {
      userId: pdpaConsents.userId,
      policyVersion: pdpaConsents.policyVersion,
    });
    await db.insert(user).values({
      id: userId,
      email: `${userId}@example.test`,
      displayName: 'Composite key user',
      fullName: 'Composite Key User',
      timezone: 'Asia/Bangkok',
    });
    await db.insert(pdpaConsents).values([
      { userId, policyVersion: 'v1' },
      { userId, policyVersion: 'v2' },
    ]);
  });

  afterAll(async () => {
    await db.delete(pdpaConsents).where(eq(pdpaConsents.userId, userId));
    await db.delete(user).where(eq(user.id, userId));
    await pool.end();
  });

  it('finds and checks rows using every key component', async () => {
    await expect(store.find({ userId, policyVersion: 'v1' })).resolves.toEqual(
      expect.objectContaining({ userId, policyVersion: 'v1' }),
    );
    await expect(store.exists({ userId, policyVersion: 'v2' })).resolves.toBe(
      true,
    );
    await expect(
      store.exists({ userId, policyVersion: 'missing' }),
    ).resolves.toBe(false);
  });

  it('deletes and returns exactly the selected composite-key row', async () => {
    await expect(
      store.create({ userId, policyVersion: 'v3' }),
    ).resolves.toEqual(
      expect.objectContaining({ userId, policyVersion: 'v3' }),
    );
    await expect(
      store.delete({ userId, policyVersion: 'v1' }),
    ).resolves.toEqual(
      expect.objectContaining({ userId, policyVersion: 'v1' }),
    );
    await expect(
      store.find({ userId, policyVersion: 'v1' }),
    ).resolves.toBeUndefined();
    await expect(store.find({ userId, policyVersion: 'v2' })).resolves.toEqual(
      expect.objectContaining({ userId, policyVersion: 'v2' }),
    );
    await expect(
      store.delete({ userId, policyVersion: 'missing' }),
    ).resolves.toBeUndefined();
  });

  it('rejects a store configured with fewer than two key columns', () => {
    expect(
      () =>
        new CompositeKeyStore(db, pdpaConsents, {
          userId: pdpaConsents.userId,
        }),
    ).toThrow('CompositeKeyStore requires at least two key columns');
  });
});
