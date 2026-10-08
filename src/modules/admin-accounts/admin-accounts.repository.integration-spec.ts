import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import { advisorProfiles, user } from '@/database/schema';
import { AdminAccountsRepository } from './admin-accounts.repository';
import { AccountQueryDto } from './dtos/account-query.dto';

/**
 * The account console's queries against real Postgres: each list filter on its own
 * and combined, a search term carrying LIKE wildcards, and the two conditional
 * status changes that must not overwrite each other.
 */
describe('AdminAccountsRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: AdminAccountsRepository;
  // Every account here carries this token in its name, so the filters can be checked
  // against a shared test database without counting anybody else's rows.
  const token = `acct${crypto.randomUUID().slice(0, 8)}`;
  const adviseeId = crypto.randomUUID();
  const advisorId = crypto.randomUUID();
  const suspendedId = crypto.randomUUID();
  const ids = [adviseeId, advisorId, suspendedId];

  function query(filters: Partial<AccountQueryDto>): AccountQueryDto {
    return Object.assign(new AccountQueryDto(), filters);
  }

  async function idsFor(filters: Partial<AccountQueryDto>): Promise<string[]> {
    const rows = await repository.findManyForAdmin(
      query({ q: token, ...filters }),
      { limit: 100, offset: 0 },
    );
    return rows.map((row) => row.id).sort((a, b) => a.localeCompare(b));
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new AdminAccountsRepository(db);

    await db.insert(user).values([
      {
        id: adviseeId,
        email: `${adviseeId}@admin-accounts.example.test`,
        displayName: `${token} 100%_advisee`,
        fullName: 'Account Advisee',
        timezone: 'Asia/Bangkok',
        role: 'advisee',
      },
      {
        id: advisorId,
        email: `${advisorId}@admin-accounts.example.test`,
        displayName: `${token} advisor`,
        fullName: 'Account Advisor',
        timezone: 'Asia/Bangkok',
        role: 'advisor',
      },
      {
        id: suspendedId,
        email: `${suspendedId}@admin-accounts.example.test`,
        displayName: `${token} suspended`,
        fullName: 'Account Suspended',
        timezone: 'Asia/Bangkok',
        role: 'advisee',
        status: 'SUSPENDED',
      },
    ]);
    await db
      .insert(advisorProfiles)
      .values({ userId: advisorId, headline: 'Account advisor' });
  });

  afterAll(async () => {
    await db
      .delete(advisorProfiles)
      .where(inArray(advisorProfiles.userId, ids));
    await db.delete(user).where(inArray(user.id, ids));
    await pool.end();
  });

  it('filters by status, by role, and by both, counting what it lists', async () => {
    const sorted = (list: string[]) =>
      [...list].sort((a, b) => a.localeCompare(b));

    await expect(idsFor({})).resolves.toEqual(sorted(ids));
    await expect(idsFor({ status: 'SUSPENDED' })).resolves.toEqual([
      suspendedId,
    ]);
    await expect(idsFor({ role: 'advisor' })).resolves.toEqual([advisorId]);
    await expect(
      idsFor({ role: 'advisee', status: 'ACTIVE' }),
    ).resolves.toEqual([adviseeId]);
    await expect(
      repository.countForAdmin(query({ q: token, role: 'advisee' })),
    ).resolves.toBe(2);
  });

  it('treats % and _ in a search as the characters, not as wildcards', async () => {
    await expect(idsFor({ q: `${token} 100%_` })).resolves.toEqual([adviseeId]);
    await expect(idsFor({ q: `${token} 1%0` })).resolves.toEqual([]);
  });

  it('includes the advisor profile in the detail, and nothing for a stranger', async () => {
    await expect(repository.findDetailById(advisorId)).resolves.toMatchObject({
      id: advisorId,
      advisorProfileUserId: advisorId,
    });
    await expect(repository.findDetailById(adviseeId)).resolves.toMatchObject({
      advisorProfileUserId: null,
    });
    await expect(
      repository.findDetailById(crypto.randomUUID()),
    ).resolves.toBeUndefined();
    await expect(
      repository.findStatusById(crypto.randomUUID()),
    ).resolves.toBeUndefined();
  });

  it('suspends only an active account and reinstates only a suspended one', async () => {
    await expect(
      repository.suspendIfActive(suspendedId, 'already suspended'),
    ).resolves.toBeUndefined();
    await expect(
      repository.reinstateIfSuspended(adviseeId),
    ).resolves.toBeUndefined();

    await expect(
      repository.suspendIfActive(adviseeId, 'spam'),
    ).resolves.toMatchObject({ id: adviseeId, status: 'SUSPENDED' });
    await expect(repository.findStatusById(adviseeId)).resolves.toBe(
      'SUSPENDED',
    );
    await expect(
      repository.reinstateIfSuspended(adviseeId),
    ).resolves.toMatchObject({ id: adviseeId, status: 'ACTIVE' });
  });
});
