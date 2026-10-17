import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import {
  adminProfiles,
  advisorProfiles,
  advisorSkills,
  skillProofDocuments,
  skills,
  user,
} from '@/database/schema';
import { SkillProofQueryDto } from './dtos/skill-proof-query.dto';
import { DECIDABLE_SKILL_PROOF_STATUSES } from './skill-proofs.constants';
import { SkillProofsRepository } from './skill-proofs.repository';

/**
 * Filing a proof against real Postgres — the document and the skill claim land
 * together, a second proof does not claim twice — and the admin queue's filters,
 * which the unit tests can only mock.
 */
describe('SkillProofsRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: SkillProofsRepository;
  const applicantId = crypto.randomUUID();
  const otherApplicantId = crypto.randomUUID();
  const adminId = crypto.randomUUID();
  const userIds = [applicantId, otherApplicantId, adminId];
  const skillIds: string[] = [];

  async function newSkill(): Promise<string> {
    const [skill] = await db
      .insert(skills)
      .values({ name: `Proof repository skill ${crypto.randomUUID()}` })
      .returning({ id: skills.id });
    skillIds.push(skill.id);
    return skill.id;
  }

  function file(advisorId: string, skillId: string, name = 'proof.pdf') {
    return {
      advisorId,
      skillId,
      objectKey: `skill-proofs/${advisorId}/${crypto.randomUUID()}.pdf`,
      originalFileName: name,
    };
  }

  function query(filters: Partial<SkillProofQueryDto>): SkillProofQueryDto {
    return Object.assign(new SkillProofQueryDto(), filters);
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new SkillProofsRepository(db);

    await db.insert(user).values(
      userIds.map((id) => ({
        id,
        email: `${id}@skill-proof-repository.example.test`,
        displayName: 'Skill proof repository test',
        fullName: 'Skill Proof Repository Test',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db.insert(advisorProfiles).values([
      { userId: applicantId, headline: 'Applicant' },
      { userId: otherApplicantId, headline: 'Other applicant' },
    ]);
    await db.insert(adminProfiles).values({ userId: adminId });
  });

  afterAll(async () => {
    const advisors = [applicantId, otherApplicantId];
    await db
      .delete(skillProofDocuments)
      .where(inArray(skillProofDocuments.advisorId, advisors));
    await db
      .delete(advisorSkills)
      .where(inArray(advisorSkills.advisorId, advisors));
    if (skillIds.length > 0) {
      await db.delete(skills).where(inArray(skills.id, skillIds));
    }
    await db
      .delete(advisorProfiles)
      .where(inArray(advisorProfiles.userId, advisors));
    await db.delete(adminProfiles).where(eq(adminProfiles.userId, adminId));
    await db.delete(user).where(inArray(user.id, userIds));
    await pool.end();
  });

  it('knows who has applied and which skills exist', async () => {
    const skillId = await newSkill();

    await expect(repository.applicationExists(applicantId)).resolves.toBe(true);
    await expect(repository.applicationExists(adminId)).resolves.toBe(false);
    await expect(repository.skillExists(skillId)).resolves.toBe(true);
    await expect(repository.skillExists(crypto.randomUUID())).resolves.toBe(
      false,
    );
  });

  it('files the document and claims its skill, once however many proofs follow', async () => {
    const skillId = await newSkill();

    const first = await repository.createForAdvisor(
      file(applicantId, skillId, 'ใบอนุญาต.pdf'),
    );
    await repository.createForAdvisor(file(applicantId, skillId, 'second.pdf'));

    expect(first).toMatchObject({
      skillId,
      reviewStatus: 'PENDING',
      originalFileName: 'ใบอนุญาต.pdf',
    });
    expect(first.skillName).toMatch(/^Proof repository skill/);
    const claims = await db
      .select()
      .from(advisorSkills)
      .where(eq(advisorSkills.skillId, skillId));
    expect(claims).toHaveLength(1);
    await expect(repository.countForAdvisor(applicantId)).resolves.toBe(2);
  });

  it('filters the admin queue by status and by advisor, and counts the same rows', async () => {
    const skillId = await newSkill();
    const reviewed = await repository.createForAdvisor(
      file(otherApplicantId, skillId),
    );
    await repository.createForAdvisor(file(otherApplicantId, skillId));
    await repository.review(reviewed.id, DECIDABLE_SKILL_PROOF_STATUSES, {
      reviewStatus: 'APPROVED',
      rejectionReason: null,
      reviewedByAdminId: adminId,
      reviewedAt: new Date(),
    });

    const approvedForOther = query({
      advisorId: otherApplicantId,
      reviewStatus: 'APPROVED',
    });
    const page = await repository.findManyForAdmin(approvedForOther, {
      limit: 20,
      offset: 0,
    });

    expect(page.map((row) => row.id)).toEqual([reviewed.id]);
    await expect(repository.countForAdmin(approvedForOther)).resolves.toBe(1);
    await expect(
      repository.countForAdmin(query({ advisorId: otherApplicantId })),
    ).resolves.toBe(2);
    await expect(
      repository.findOneForAdmin(reviewed.id),
    ).resolves.toMatchObject({ reviewStatus: 'APPROVED' });
  });

  it('refuses a second review of the same document', async () => {
    const skillId = await newSkill();
    const proof = await repository.createForAdvisor(file(applicantId, skillId));
    const ruling = {
      reviewStatus: 'REJECTED' as const,
      rejectionReason: 'Unreadable',
      reviewedByAdminId: adminId,
      reviewedAt: new Date(),
    };

    await expect(
      repository.review(proof.id, DECIDABLE_SKILL_PROOF_STATUSES, ruling),
    ).resolves.toBe(true);
    await expect(
      repository.review(proof.id, DECIDABLE_SKILL_PROOF_STATUSES, ruling),
    ).resolves.toBe(false);
  });
});
