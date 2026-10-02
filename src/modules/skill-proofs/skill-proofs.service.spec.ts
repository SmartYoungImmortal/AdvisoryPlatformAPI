import { ConflictException, NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { skillProofDocuments } from '@/database/schema';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { OwnSkillProofRow } from './dtos/own-skill-proof-response.dto';
import { SkillProofQueryDto } from './dtos/skill-proof-query.dto';
import type { SkillProofRow } from './dtos/skill-proof-response.dto';
import { SKILL_PROOF_MESSAGES } from './skill-proofs.constants';
import type { SkillProofsRepository } from './skill-proofs.repository';
import { SkillProofsService } from './skill-proofs.service';

type SkillProofDocument = InferSelectModel<typeof skillProofDocuments>;

const admin = {
  id: '99999999-9999-4999-8999-999999999999',
} as SessionUser;
const advisor = {
  id: '11111111-1111-4111-8111-111111111111',
} as SessionUser;
const proofId = '22222222-2222-4222-8222-222222222222';
const skillId = '33333333-3333-4333-8333-333333333333';

function queueRow(overrides: Partial<SkillProofRow> = {}): SkillProofRow {
  return {
    id: proofId,
    advisorId: advisor.id,
    advisorDisplayName: 'Advisor',
    skillId,
    skillName: 'Financial planning',
    objectKey: 'skill-proofs/advisor/certificate.pdf',
    originalFileName: 'certificate.pdf',
    reviewStatus: 'PENDING',
    rejectionReason: null,
    reviewedByAdminId: null,
    reviewedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function ownRow(overrides: Partial<OwnSkillProofRow> = {}): OwnSkillProofRow {
  return {
    id: proofId,
    skillId,
    skillName: 'Financial planning',
    objectKey: 'skill-proofs/advisor/certificate.pdf',
    originalFileName: 'certificate.pdf',
    reviewStatus: 'PENDING',
    rejectionReason: null,
    reviewedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function document(
  overrides: Partial<SkillProofDocument> = {},
): SkillProofDocument {
  return {
    id: proofId,
    advisorId: advisor.id,
    skillId,
    objectKey: 'skill-proofs/advisor/certificate.pdf',
    originalFileName: 'certificate.pdf',
    reviewStatus: 'APPROVED',
    reviewedByAdminId: admin.id,
    rejectionReason: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    reviewedAt: new Date('2026-02-01T00:00:00Z'),
    ...overrides,
  };
}

describe('SkillProofsService', () => {
  let repository: jest.Mocked<
    Pick<
      SkillProofsRepository,
      | 'findManyForAdmin'
      | 'countForAdmin'
      | 'findOneForAdmin'
      | 'findManyForAdvisor'
      | 'countForAdvisor'
      | 'review'
      | 'findById'
    >
  >;
  let service: SkillProofsService;

  beforeEach(() => {
    repository = {
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      findManyForAdvisor: jest.fn(),
      countForAdvisor: jest.fn(),
      review: jest.fn(),
      findById: jest.fn(),
    };
    service = new SkillProofsService(
      repository as unknown as SkillProofsRepository,
    );
  });

  describe('the queue', () => {
    it('pages the queue and counts it over the same filter', async () => {
      repository.findManyForAdmin.mockResolvedValue([queueRow()]);
      repository.countForAdmin.mockResolvedValue(1);
      const query = new SkillProofQueryDto();
      query.reviewStatus = 'PENDING';
      query.advisorId = advisor.id;

      const result = await service.findManyForAdmin(query);

      expect(repository.findManyForAdmin).toHaveBeenCalledWith(query, {
        limit: 20,
        offset: 0,
      });
      expect(repository.countForAdmin).toHaveBeenCalledWith(query);
      expect(result.total).toBe(1);
      expect(result.items[0].skillName).toBe('Financial planning');
      expect(result.items[0].advisorDisplayName).toBe('Advisor');
    });

    it('404s for a document that does not exist', async () => {
      repository.findOneForAdmin.mockResolvedValue(undefined);

      await expect(service.findOneForAdmin(proofId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('writes the outcome, the time and the reviewing admin', async () => {
      repository.review.mockResolvedValue(true);
      repository.findOneForAdmin.mockResolvedValue(
        queueRow({
          reviewStatus: 'APPROVED',
          reviewedByAdminId: admin.id,
          reviewedAt: new Date('2026-02-01T00:00:00Z'),
        }),
      );

      const result = await service.approve(admin, proofId);

      expect(repository.review).toHaveBeenCalledWith(
        proofId,
        ['PENDING'],
        expect.objectContaining({
          reviewStatus: 'APPROVED',
          reviewedByAdminId: admin.id,
          rejectionReason: null,
        }),
      );
      expect(repository.review.mock.calls[0][2].reviewedAt).toBeInstanceOf(
        Date,
      );
      expect(result.reviewStatus).toBe('APPROVED');
      expect(result.reviewedByAdminId).toBe(admin.id);
    });

    it('conflicts on a document that has already been reviewed', async () => {
      repository.review.mockResolvedValue(false);
      repository.findById.mockResolvedValue(document());

      await expect(service.approve(admin, proofId)).rejects.toThrow(
        new ConflictException(SKILL_PROOF_MESSAGES.alreadyReviewed),
      );
      expect(repository.findOneForAdmin).not.toHaveBeenCalled();
    });

    it('404s when the document does not exist at all', async () => {
      repository.review.mockResolvedValue(false);
      repository.findById.mockResolvedValue(undefined);

      await expect(service.approve(admin, proofId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('writes the reason, the time and the reviewing admin', async () => {
      repository.review.mockResolvedValue(true);
      repository.findOneForAdmin.mockResolvedValue(
        queueRow({
          reviewStatus: 'REJECTED',
          rejectionReason: 'The certificate has expired',
          reviewedByAdminId: admin.id,
          reviewedAt: new Date('2026-02-01T00:00:00Z'),
        }),
      );

      const result = await service.reject(admin, proofId, {
        reason: 'The certificate has expired',
      });

      expect(repository.review).toHaveBeenCalledWith(
        proofId,
        ['PENDING'],
        expect.objectContaining({
          reviewStatus: 'REJECTED',
          rejectionReason: 'The certificate has expired',
          reviewedByAdminId: admin.id,
        }),
      );
      expect(repository.review.mock.calls[0][2].reviewedAt).toBeInstanceOf(
        Date,
      );
      expect(result.rejectionReason).toBe('The certificate has expired');
    });

    it('conflicts on a document that has already been rejected', async () => {
      repository.review.mockResolvedValue(false);
      repository.findById.mockResolvedValue(
        document({ reviewStatus: 'REJECTED', rejectionReason: 'Expired' }),
      );

      await expect(
        service.reject(admin, proofId, { reason: 'Second opinion' }),
      ).rejects.toThrow(
        new ConflictException(SKILL_PROOF_MESSAGES.alreadyReviewed),
      );
    });
  });

  describe("the advisor's own documents", () => {
    it('pages their own outcomes without naming the reviewing admin', async () => {
      repository.findManyForAdvisor.mockResolvedValue([
        ownRow({
          reviewStatus: 'REJECTED',
          rejectionReason: 'The certificate has expired',
          reviewedAt: new Date('2026-02-01T00:00:00Z'),
        }),
      ]);
      repository.countForAdvisor.mockResolvedValue(1);

      const result = await service.findManyForAdvisor(
        advisor,
        new OffsetPaginationDto(),
      );

      expect(repository.findManyForAdvisor).toHaveBeenCalledWith(advisor.id, {
        limit: 20,
        offset: 0,
      });
      expect(repository.countForAdvisor).toHaveBeenCalledWith(advisor.id);
      expect(result.items[0].rejectionReason).toBe(
        'The certificate has expired',
      );
      expect(Object.keys(result.items[0])).not.toContain('reviewedByAdminId');
    });
  });
});
