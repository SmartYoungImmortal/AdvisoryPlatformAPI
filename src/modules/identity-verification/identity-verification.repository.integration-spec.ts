import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { RoleRepository } from '@/common/authorization/role.repository';
import type { DrizzleDB } from '@/database/database.module';
import {
  adminProfiles,
  advisorIdentity,
  advisorProfiles,
  user,
} from '@/database/schema';
import {
  DECIDABLE_IDENTITY_STATUSES,
  SUBMITTABLE_IDENTITY_STATUSES,
} from './identity-verification.constants';
import {
  IdentityVerificationRepository,
  type IdentityDecision,
} from './identity-verification.repository';

/**
 * The submission and approval writes against real Postgres: the row lock that
 * serializes two racing submissions, the statuses a resubmission is accepted from,
 * and the one transaction that makes an identity `VERIFIED` and its owner an Advisor.
 */
describe('IdentityVerificationRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: IdentityVerificationRepository;
  let roles: RoleRepository;
  const userIds: string[] = [];
  const adminId = crypto.randomUUID();

  async function applicant(role: string | null = 'advisee'): Promise<string> {
    const id = crypto.randomUUID();
    userIds.push(id);
    await db.insert(user).values({
      id,
      email: `${id}@identity-repository.example.test`,
      displayName: 'Identity repository test',
      fullName: 'Identity Repository Test',
      timezone: 'Asia/Bangkok',
      role,
    });
    await db
      .insert(advisorProfiles)
      .values({ userId: id, headline: 'Applicant' });
    return id;
  }

  function approval(): IdentityDecision {
    return {
      verificationStatus: 'VERIFIED',
      rejectionReason: null,
      verifiedByAdminId: adminId,
      verifiedAt: new Date(),
    };
  }

  async function roleOf(id: string): Promise<string | null> {
    const [row] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, id));
    return row.role;
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new IdentityVerificationRepository(db);
    roles = new RoleRepository(db);

    userIds.push(adminId);
    await db.insert(user).values({
      id: adminId,
      email: `${adminId}@identity-repository.example.test`,
      displayName: 'Identity repository admin',
      fullName: 'Identity Repository Admin',
      timezone: 'Asia/Bangkok',
      role: 'admin',
    });
    await db.insert(adminProfiles).values({ userId: adminId });
  });

  afterAll(async () => {
    if (userIds.length > 0) {
      await db
        .delete(advisorIdentity)
        .where(inArray(advisorIdentity.advisorId, userIds));
      await db
        .delete(advisorProfiles)
        .where(inArray(advisorProfiles.userId, userIds));
      await db.delete(adminProfiles).where(eq(adminProfiles.userId, adminId));
      await db.delete(user).where(inArray(user.id, userIds));
    }
    await pool.end();
  });

  it('knows who has applied', async () => {
    const id = await applicant();

    await expect(repository.applicationExists(id)).resolves.toBe(true);
    await expect(
      repository.applicationExists(crypto.randomUUID()),
    ).resolves.toBe(false);
  });

  it('creates the record on first submission and puts it up for review', async () => {
    const id = await applicant();

    const result = await repository.submit(
      id,
      'identity/first.jpg',
      SUBMITTABLE_IDENTITY_STATUSES,
    );

    expect(result).toEqual({
      submittedAt: expect.any(Date) as Date,
      previousDocumentObjectKey: null,
    });
    await expect(repository.findOwn(id)).resolves.toMatchObject({
      verificationStatus: 'SUBMITTED',
      documentObjectKey: 'identity/first.jpg',
    });
  });

  it('refuses to swap the document of a submission under review', async () => {
    const id = await applicant();
    await repository.submit(
      id,
      'identity/a.jpg',
      SUBMITTABLE_IDENTITY_STATUSES,
    );

    await expect(
      repository.submit(id, 'identity/b.jpg', SUBMITTABLE_IDENTITY_STATUSES),
    ).resolves.toBeUndefined();
    await expect(repository.findOwn(id)).resolves.toMatchObject({
      documentObjectKey: 'identity/a.jpg',
    });
  });

  it('serializes two simultaneous first submissions: exactly one wins', async () => {
    const id = await applicant();

    const results = await Promise.all([
      repository.submit(id, 'identity/left.jpg', SUBMITTABLE_IDENTITY_STATUSES),
      repository.submit(
        id,
        'identity/right.jpg',
        SUBMITTABLE_IDENTITY_STATUSES,
      ),
    ]);

    expect(results.filter((r) => r !== undefined)).toHaveLength(1);
  });

  it('accepts a resubmission after a rejection, clearing the last ruling', async () => {
    const id = await applicant();
    await repository.submit(
      id,
      'identity/blurry.jpg',
      SUBMITTABLE_IDENTITY_STATUSES,
    );
    await repository.decide(id, DECIDABLE_IDENTITY_STATUSES, {
      verificationStatus: 'REJECTED',
      rejectionReason: 'Blurry',
      verifiedByAdminId: adminId,
      verifiedAt: null,
    });

    const result = await repository.submit(
      id,
      'identity/sharp.jpg',
      SUBMITTABLE_IDENTITY_STATUSES,
    );

    expect(result?.previousDocumentObjectKey).toBe('identity/blurry.jpg');
    await expect(repository.findOwn(id)).resolves.toMatchObject({
      verificationStatus: 'SUBMITTED',
      documentObjectKey: 'identity/sharp.jpg',
      rejectionReason: null,
    });
  });

  it('makes the applicant an Advisor in the same write that verifies them', async () => {
    const id = await applicant();
    await repository.submit(
      id,
      'identity/ok.jpg',
      SUBMITTABLE_IDENTITY_STATUSES,
    );
    await expect(roles.findMembership(id)).resolves.toMatchObject({
      isAdvisor: false,
    });

    await expect(
      repository.approve(id, DECIDABLE_IDENTITY_STATUSES, approval()),
    ).resolves.toBe(true);

    await expect(roleOf(id)).resolves.toBe('advisor');
    await expect(roles.findMembership(id)).resolves.toMatchObject({
      isAdvisor: true,
    });
  });

  it('grants nothing when the approval does not apply', async () => {
    const id = await applicant();
    // Never submitted: there is no `SUBMITTED` record for the ruling to match.

    await expect(
      repository.approve(id, DECIDABLE_IDENTITY_STATUSES, approval()),
    ).resolves.toBe(false);

    await expect(roleOf(id)).resolves.toBe('advisee');
  });

  it('leaves an admin who applies as an admin', async () => {
    const id = await applicant('admin');
    await repository.submit(
      id,
      'identity/staff.jpg',
      SUBMITTABLE_IDENTITY_STATUSES,
    );

    await repository.approve(id, DECIDABLE_IDENTITY_STATUSES, approval());

    await expect(roleOf(id)).resolves.toBe('admin');
    await expect(roles.findMembership(id)).resolves.toMatchObject({
      isAdvisor: true,
    });
  });

  it('does not grant the role on a rejection', async () => {
    const id = await applicant();
    await repository.submit(
      id,
      'identity/no.jpg',
      SUBMITTABLE_IDENTITY_STATUSES,
    );

    await repository.decide(id, DECIDABLE_IDENTITY_STATUSES, {
      verificationStatus: 'REJECTED',
      rejectionReason: 'Not a real card',
      verifiedByAdminId: adminId,
      verifiedAt: null,
    });

    await expect(roleOf(id)).resolves.toBe('advisee');
    await expect(roles.findMembership(id)).resolves.toMatchObject({
      isAdvisor: false,
    });
  });
});
