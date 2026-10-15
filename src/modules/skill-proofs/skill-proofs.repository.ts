import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, inArray, type SQL } from 'drizzle-orm';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { skillProofDocuments, skills, user } from '@/database/schema';
import type { OwnSkillProofRow } from './dtos/own-skill-proof-response.dto';
import type { SkillProofQueryDto } from './dtos/skill-proof-query.dto';
import type { SkillProofRow } from './dtos/skill-proof-response.dto';
import type { SkillProofReviewStatus } from './skill-proofs.constants';

/** The columns a review writes. Nothing else about the document is a reviewer's to change. */
export interface SkillProofReview {
  reviewStatus: SkillProofReviewStatus;
  rejectionReason: string | null;
  reviewedByAdminId: string;
  reviewedAt: Date | null;
}

@Injectable()
export class SkillProofsRepository extends EntityRepository<
  typeof skillProofDocuments
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, skillProofDocuments);
  }

  /**
   * One page of the admin queue, oldest submission first so the longest wait is at the
   * top, with the id as a tiebreak so paging is stable.
   */
  findManyForAdmin(
    query: SkillProofQueryDto,
    options: { limit: number; offset: number },
  ): Promise<SkillProofRow[]> {
    return this.selectForAdmin(this.queueWhere(query))
      .orderBy(asc(skillProofDocuments.createdAt), asc(skillProofDocuments.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same two joins the page uses, not through the inherited `count()`.
   *
   * The inherited one selects `from(skill_proof_documents)` alone, and this queue's
   * page joins `user` and `skills`. That mismatch is exactly what made
   * `GET /api/v1/services` answer 500 for every request — a WHERE naming a table
   * absent from the FROM, which Postgres rejects. Even with the filter touching only
   * `skill_proof_documents`, as it does today, the inner joins can drop a row: a
   * document whose skill row is gone is not on the page, so it must not be in the
   * total either, or the last page comes back empty.
   */
  async countForAdmin(query: SkillProofQueryDto): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(skillProofDocuments)
      .innerJoin(user, eq(user.id, skillProofDocuments.advisorId))
      .innerJoin(skills, eq(skills.id, skillProofDocuments.skillId))
      .where(this.queueWhere(query));
    return row?.value ?? 0;
  }

  async findOneForAdmin(proofId: string): Promise<SkillProofRow | undefined> {
    const [row] = await this.selectForAdmin(
      eq(skillProofDocuments.id, proofId),
    ).limit(1);
    return row;
  }

  /** The Advisor's own documents, newest last so the list reads in submission order. */
  findManyForAdvisor(
    advisorId: string,
    options: { limit: number; offset: number },
  ): Promise<OwnSkillProofRow[]> {
    return this.selectForAdvisor(eq(skillProofDocuments.advisorId, advisorId))
      .orderBy(asc(skillProofDocuments.createdAt), asc(skillProofDocuments.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /** Counted over the same join the owner's page uses, for the same reason as above. */
  async countForAdvisor(advisorId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(skillProofDocuments)
      .innerJoin(skills, eq(skills.id, skillProofDocuments.skillId))
      .where(eq(skillProofDocuments.advisorId, advisorId));
    return row?.value ?? 0;
  }

  /**
   * Applies a review only while the document is still in a status that accepts one, so
   * two admins clicking approve at the same moment cannot both win and no review needs
   * a read-then-write lock. `false` means the row is gone or somebody reviewed first;
   * the service reads the row back to say which.
   */
  async review(
    proofId: string,
    acceptedStatuses: readonly SkillProofReviewStatus[],
    review: SkillProofReview,
  ): Promise<boolean> {
    const rows = await this.updateWhere(
      and(
        eq(skillProofDocuments.id, proofId),
        inArray(skillProofDocuments.reviewStatus, [...acceptedStatuses]),
      ) as SQL,
      review,
    );
    return rows.length > 0;
  }

  /** One shape for every admin-facing response, so the queue and a review agree. */
  private selectForAdmin(where: SQL | undefined) {
    return this.db
      .select({
        id: skillProofDocuments.id,
        advisorId: skillProofDocuments.advisorId,
        advisorDisplayName: user.displayName,
        skillId: skillProofDocuments.skillId,
        skillName: skills.name,
        objectKey: skillProofDocuments.objectKey,
        originalFileName: skillProofDocuments.originalFileName,
        reviewStatus: skillProofDocuments.reviewStatus,
        rejectionReason: skillProofDocuments.rejectionReason,
        reviewedByAdminId: skillProofDocuments.reviewedByAdminId,
        reviewedAt: skillProofDocuments.reviewedAt,
        createdAt: skillProofDocuments.createdAt,
      })
      .from(skillProofDocuments)
      .innerJoin(user, eq(user.id, skillProofDocuments.advisorId))
      .innerJoin(skills, eq(skills.id, skillProofDocuments.skillId))
      .where(where)
      .$dynamic();
  }

  /** The owner's shape: the skill name is joined, the submitter is not. */
  private selectForAdvisor(where: SQL | undefined) {
    return this.db
      .select({
        id: skillProofDocuments.id,
        skillId: skillProofDocuments.skillId,
        skillName: skills.name,
        objectKey: skillProofDocuments.objectKey,
        originalFileName: skillProofDocuments.originalFileName,
        reviewStatus: skillProofDocuments.reviewStatus,
        rejectionReason: skillProofDocuments.rejectionReason,
        reviewedAt: skillProofDocuments.reviewedAt,
        createdAt: skillProofDocuments.createdAt,
      })
      .from(skillProofDocuments)
      .innerJoin(skills, eq(skills.id, skillProofDocuments.skillId))
      .where(where)
      .$dynamic();
  }

  private queueWhere(query: SkillProofQueryDto): SQL<unknown> | undefined {
    return and(
      query.reviewStatus
        ? eq(skillProofDocuments.reviewStatus, query.reviewStatus)
        : undefined,
      query.advisorId
        ? eq(skillProofDocuments.advisorId, query.advisorId)
        : undefined,
    );
  }
}
