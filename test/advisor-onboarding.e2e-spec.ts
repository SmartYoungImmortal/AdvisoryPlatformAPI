import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq, inArray } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import {
  adminProfiles,
  advisorIdentity,
  advisorSkills,
  skills,
  user,
} from '@/database/schema';
import type { SeaweedFsStorageStub } from './stubs/seaweedfs-storage.stub';
import { signUpUser, type SignedUpUser } from './support/accounts';
import {
  createBookingFixtureIds,
  deleteBookingFixtures,
  seedAdvisorService,
} from './support/booking-fixtures';
import { createE2eApp } from './support/e2e-app';
import { data, object, stringField } from './support/response';

async function roles(applicant: SignedUpUser): Promise<unknown> {
  const me = await applicant.agent.get('/api/v1/users/me').expect(200);
  return data(me.body).roles;
}

/**
 * Becoming an Advisor, end to end over HTTP against real Postgres: apply, upload the
 * ID card and a skill proof, get rejected, resubmit, get approved — and at every step
 * prove what the account may and may not do. Only object storage is stubbed.
 *
 * The rule under test (Figma's onboarding flow, and the 22-08-2569 meeting): an
 * account is an Advisor only once an admin has verified its identity. Before that it
 * is an Advisee with an application, and nothing it owns is public or bookable.
 */
describe('advisor onboarding (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  let storage: SeaweedFsStorageStub;
  const ids = createBookingFixtureIds();
  const skillIds: string[] = [];

  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const PDF = Buffer.from('%PDF-1.7\n');

  beforeAll(async () => {
    ({ app, db, storage } = await createE2eApp());
  });

  afterEach(async () => {
    storage.clear();
    await deleteBookingFixtures(db, ids);
    const created = skillIds.splice(0);
    if (created.length > 0) {
      await db.delete(skills).where(inArray(skills.id, created));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const signUp = (label = 'Onboarding') => signUpUser(app, label, ids.userIds);

  async function signUpAdmin(): Promise<SignedUpUser> {
    const admin = await signUp('Onboarding admin');
    await db.insert(adminProfiles).values({ userId: admin.userId });
    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(user.id, admin.userId));
    return admin;
  }

  async function catalogueSkill(): Promise<string> {
    const [skill] = await db
      .insert(skills)
      .values({ name: `Onboarding skill ${crypto.randomUUID()}` })
      .returning({ id: skills.id });
    skillIds.push(skill.id);
    return skill.id;
  }

  function submitIdentity(applicant: SignedUpUser, name = 'id-card.jpg') {
    return applicant.agent
      .post('/api/v1/advisors/me/identity-verification')
      .attach('document', JPEG, { filename: name, contentType: 'image/jpeg' });
  }

  async function documentKey(advisorId: string): Promise<string | null> {
    const [row] = await db
      .select({ key: advisorIdentity.documentObjectKey })
      .from(advisorIdentity)
      .where(eq(advisorIdentity.advisorId, advisorId));
    return row?.key ?? null;
  }

  it('walks an applicant from Advisee to Advisor, and only an admin approval opens the workspace', async () => {
    const applicant = await signUp();
    const admin = await signUpAdmin();
    const skillId = await catalogueSkill();

    // Stage 1 — apply. The profile exists; the role does not.
    const applied = await applicant.agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Tax advisor', bio: 'Ten years in practice.' })
      .expect(201);
    expect(data(applied.body)).toMatchObject({ verificationStatus: 'NONE' });
    expect(await roles(applicant)).toEqual(['ADVISEE']);

    // The workspace is shut to an applicant — reads as well as writes.
    await applicant.agent
      .get('/api/v1/advisors/me/availability/global')
      .expect(403);
    await applicant.agent.get('/api/v1/advisors/me/services').expect(403);
    await applicant.agent.get('/api/v1/advisors/me/bookings').expect(403);
    await applicant.agent
      .post('/api/v1/advisors/me/availability/profiles')
      .send({ name: 'Too early', weeklyWindows: [] })
      .expect(403);

    // Stage 2 — the ID card. Only a photo is accepted.
    await applicant.agent
      .post('/api/v1/advisors/me/identity-verification')
      .expect(400);
    await applicant.agent
      .post('/api/v1/advisors/me/identity-verification')
      .attach('document', PDF, {
        filename: 'id-card.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    const submitted = await submitIdentity(applicant).expect(201);
    // Status and time only: never the key, never a URL.
    expect(Object.keys(data(submitted.body))).toEqual([
      'verificationStatus',
      'submittedAt',
    ]);
    expect(data(submitted.body).verificationStatus).toBe('SUBMITTED');
    const firstKey = await documentKey(applicant.userId);
    expect(firstKey).toMatch(new RegExp(`^identity/${applicant.userId}/`));
    expect(storage.hasObject(firstKey!)).toBe(true);

    // A document under review is not swapped out from under the reviewer, and the
    // refused upload does not linger in storage.
    await submitIdentity(applicant, 'second.jpg').expect(409);
    expect(await documentKey(applicant.userId)).toBe(firstKey);
    expect(storage.objectCount()).toBe(1);

    // Stage 3 — a skill proof, with the Thai file name kept intact.
    const proof = await applicant.agent
      .post('/api/v1/advisors/me/skill-proofs')
      .field('skillId', skillId)
      .attach('file', PDF, {
        filename: 'ใบอนุญาตผู้สอบบัญชี.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    expect(data(proof.body)).toMatchObject({
      skillId,
      reviewStatus: 'PENDING',
      originalFileName: 'ใบอนุญาตผู้สอบบัญชี.pdf',
    });
    const claimed = await db
      .select()
      .from(advisorSkills)
      .where(eq(advisorSkills.advisorId, applicant.userId));
    expect(claimed.map((row) => row.skillId)).toEqual([skillId]);
    const mine = await applicant.agent
      .get('/api/v1/advisors/me/skill-proofs')
      .expect(200);
    expect(data(mine.body).total).toBe(1);

    const pending = await applicant.agent
      .get('/api/v1/advisors/me')
      .expect(200);
    expect(data(pending.body).verificationStatus).toBe('SUBMITTED');

    // An applicant cannot rule on their own application.
    await applicant.agent
      .post(`/api/v1/admin/identity-verifications/${applicant.userId}/approve`)
      .expect(403);

    // The admin sends it back.
    await admin.agent
      .post(`/api/v1/admin/identity-verifications/${applicant.userId}/reject`)
      .send({ reason: 'The card number is not readable' })
      .expect(200);
    const rejected = await applicant.agent
      .get('/api/v1/advisors/me/identity-verification')
      .expect(200);
    expect(data(rejected.body)).toMatchObject({
      verificationStatus: 'REJECTED',
      rejectionReason: 'The card number is not readable',
    });
    expect(await roles(applicant)).toEqual(['ADVISEE']);
    await applicant.agent.get('/api/v1/advisors/me/services').expect(403);

    // Resubmission replaces the rejected scan, in the record and in storage.
    await submitIdentity(applicant, 'sharper.jpg').expect(201);
    const secondKey = await documentKey(applicant.userId);
    expect(secondKey).not.toBe(firstKey);
    expect(storage.hasObject(firstKey!)).toBe(false);
    expect(storage.hasObject(secondKey!)).toBe(true);

    // The admin approves — and that, alone, makes the account an Advisor.
    const approved = await admin.agent
      .post(`/api/v1/admin/identity-verifications/${applicant.userId}/approve`)
      .expect(200);
    expect(data(approved.body).verificationStatus).toBe('VERIFIED');
    expect(await roles(applicant)).toEqual(['ADVISEE', 'ADVISOR']);
    await applicant.agent
      .get('/api/v1/advisors/me/availability/global')
      .expect(200);
    await applicant.agent.get('/api/v1/advisors/me/services').expect(200);

    // Verified is final: there is nothing left to resubmit.
    await submitIdentity(applicant, 'again.jpg').expect(409);
  });

  it('refuses document uploads from an Advisee who has not applied', async () => {
    const advisee = await signUp();
    const skillId = await catalogueSkill();

    await submitIdentity(advisee).expect(404);
    await advisee.agent
      .post('/api/v1/advisors/me/skill-proofs')
      .field('skillId', skillId)
      .attach('file', PDF, {
        filename: 'certificate.pdf',
        contentType: 'application/pdf',
      })
      .expect(404);
    expect(storage.objectCount()).toBe(0);
  });

  it('400s a skill proof for a skill that is not in the catalogue', async () => {
    const applicant = await signUp();
    await applicant.agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Applicant' })
      .expect(201);

    await applicant.agent
      .post('/api/v1/advisors/me/skill-proofs')
      .field('skillId', crypto.randomUUID())
      .attach('file', PDF, {
        filename: 'certificate.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    expect(storage.objectCount()).toBe(0);
  });

  it('keeps a Service out of discovery and booking while its Advisor is not verified', async () => {
    const { advisor, serviceId, bookingDate, slotAt } =
      await seedAdvisorService({ app, db }, ids, { label: 'Onboarding' });
    const advisee = await signUp();

    // Verified: listed, open, bookable.
    const listed = await advisee.agent
      .get('/api/v1/services')
      .query({ advisorId: advisor.userId })
      .expect(200);
    expect(data(listed.body).total).toBe(1);
    await advisee.agent.get(`/api/v1/advisors/${advisor.userId}`).expect(200);

    // The same rows, with the identity no longer verified — the shape a published
    // Service by an unapproved account takes in data that predates the gate.
    await db
      .update(advisorIdentity)
      .set({ verificationStatus: 'SUBMITTED', verifiedAt: null })
      .where(eq(advisorIdentity.advisorId, advisor.userId));

    const hidden = await advisee.agent
      .get('/api/v1/services')
      .query({ advisorId: advisor.userId })
      .expect(200);
    expect(data(hidden.body).total).toBe(0);
    await advisee.agent.get(`/api/v1/services/${serviceId}`).expect(404);
    await advisee.agent.get(`/api/v1/advisors/${advisor.userId}`).expect(404);
    await advisee.agent
      .get(`/api/v1/services/${serviceId}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(404);
    const refused = await advisee.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime: slotAt('09:00') })
      .expect(404);
    expect(stringField(object(refused.body), 'message')).toBeTruthy();
  });
});
