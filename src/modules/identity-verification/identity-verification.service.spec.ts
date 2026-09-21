import { ConflictException, NotFoundException } from '@nestjs/common';
import type { SessionUser } from '@/modules/auth/auth.config';
import { IdentityVerificationQueryDto } from './dtos/identity-verification-query.dto';
import type { IdentityVerificationRow } from './dtos/identity-verification-response.dto';
import type { OwnIdentityVerificationRow } from './dtos/own-identity-verification-response.dto';
import { IDENTITY_VERIFICATION_MESSAGES } from './identity-verification.constants';
import type { IdentityVerificationRepository } from './identity-verification.repository';
import { IdentityVerificationService } from './identity-verification.service';

const admin = {
  id: '99999999-9999-4999-8999-999999999999',
} as SessionUser;
const advisor = {
  id: '11111111-1111-4111-8111-111111111111',
} as SessionUser;

function queueRow(
  overrides: Partial<IdentityVerificationRow> = {},
): IdentityVerificationRow {
  return {
    advisorId: advisor.id,
    displayName: 'Advisor',
    email: 'advisor@example.test',
    verificationStatus: 'SUBMITTED',
    documentObjectKey: 'identity/advisor/scan.jpg',
    rejectionReason: null,
    submittedAt: new Date('2026-01-01T00:00:00Z'),
    verifiedAt: null,
    verifiedByAdminId: null,
    ...overrides,
  };
}

function ownRow(
  overrides: Partial<OwnIdentityVerificationRow> = {},
): OwnIdentityVerificationRow {
  return {
    advisorId: advisor.id,
    verificationStatus: 'SUBMITTED',
    documentObjectKey: 'identity/advisor/scan.jpg',
    rejectionReason: null,
    submittedAt: new Date('2026-01-01T00:00:00Z'),
    verifiedAt: null,
    ...overrides,
  };
}

describe('IdentityVerificationService', () => {
  let repository: jest.Mocked<
    Pick<
      IdentityVerificationRepository,
      | 'findManyForAdmin'
      | 'countForAdmin'
      | 'findOneForAdmin'
      | 'findOwn'
      | 'decide'
    >
  >;
  let service: IdentityVerificationService;

  beforeEach(() => {
    repository = {
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      findOwn: jest.fn(),
      decide: jest.fn(),
    };
    service = new IdentityVerificationService(
      repository as unknown as IdentityVerificationRepository,
    );
  });

  describe('the queue', () => {
    it('pages the queue and counts it over the same filter', async () => {
      repository.findManyForAdmin.mockResolvedValue([queueRow()]);
      repository.countForAdmin.mockResolvedValue(1);
      const query = new IdentityVerificationQueryDto();
      query.status = 'SUBMITTED';

      const result = await service.findManyForAdmin(query);

      expect(repository.findManyForAdmin).toHaveBeenCalledWith(query, {
        limit: 20,
        offset: 0,
      });
      expect(repository.countForAdmin).toHaveBeenCalledWith(query);
      expect(result.total).toBe(1);
      expect(result.items[0].displayName).toBe('Advisor');
    });

    it('answers a queue row with the reviewed allowlist and nothing else', async () => {
      repository.findOneForAdmin.mockResolvedValue(queueRow());

      const result = await service.findOneForAdmin(advisor.id);

      // The guard that matters: neither `nationalIdEncrypted` nor `nationalIdHash`
      // reaches an admin response either. No screen needs them.
      expect(Object.keys(result)).toEqual([
        'advisorId',
        'displayName',
        'email',
        'verificationStatus',
        'documentObjectKey',
        'rejectionReason',
        'submittedAt',
        'verifiedAt',
        'verifiedByAdminId',
      ]);
    });

    it('404s rather than answering an empty record for an advisor with none', async () => {
      repository.findOneForAdmin.mockResolvedValue(undefined);

      await expect(service.findOneForAdmin(advisor.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('writes the outcome, the time and the deciding admin', async () => {
      repository.decide.mockResolvedValue(true);
      repository.findOneForAdmin.mockResolvedValue(
        queueRow({
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date('2026-02-01T00:00:00Z'),
          verifiedByAdminId: admin.id,
        }),
      );

      const result = await service.approve(admin, advisor.id);

      expect(repository.decide).toHaveBeenCalledWith(
        advisor.id,
        ['SUBMITTED'],
        expect.objectContaining({
          verificationStatus: 'VERIFIED',
          verifiedByAdminId: admin.id,
          rejectionReason: null,
        }),
      );
      expect(repository.decide.mock.calls[0][2].verifiedAt).toBeInstanceOf(
        Date,
      );
      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.verifiedByAdminId).toBe(admin.id);
    });

    it('conflicts on a record that has already been decided', async () => {
      repository.decide.mockResolvedValue(false);
      repository.findOwn.mockResolvedValue(
        ownRow({ verificationStatus: 'VERIFIED' }),
      );

      await expect(service.approve(admin, advisor.id)).rejects.toThrow(
        new ConflictException(IDENTITY_VERIFICATION_MESSAGES.alreadyDecided),
      );
      expect(repository.findOneForAdmin).not.toHaveBeenCalled();
    });

    it('conflicts with its own message on a record nobody has submitted', async () => {
      repository.decide.mockResolvedValue(false);
      repository.findOwn.mockResolvedValue(
        ownRow({
          verificationStatus: 'NONE',
          documentObjectKey: null,
          submittedAt: null,
        }),
      );

      await expect(service.approve(admin, advisor.id)).rejects.toThrow(
        new ConflictException(IDENTITY_VERIFICATION_MESSAGES.notSubmitted),
      );
    });

    it('404s when the record does not exist at all', async () => {
      repository.decide.mockResolvedValue(false);
      repository.findOwn.mockResolvedValue(undefined);

      await expect(service.approve(admin, advisor.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('writes the reason and the deciding admin, and verifies nothing', async () => {
      repository.decide.mockResolvedValue(true);
      repository.findOneForAdmin.mockResolvedValue(
        queueRow({
          verificationStatus: 'REJECTED',
          rejectionReason: 'The scan is unreadable',
          verifiedByAdminId: admin.id,
        }),
      );

      const result = await service.reject(admin, advisor.id, {
        reason: 'The scan is unreadable',
      });

      expect(repository.decide).toHaveBeenCalledWith(
        advisor.id,
        ['SUBMITTED'],
        {
          verificationStatus: 'REJECTED',
          rejectionReason: 'The scan is unreadable',
          verifiedByAdminId: admin.id,
          verifiedAt: null,
        },
      );
      expect(result.rejectionReason).toBe('The scan is unreadable');
      expect(result.verifiedAt).toBeNull();
    });

    it('conflicts on a record that has already been rejected', async () => {
      repository.decide.mockResolvedValue(false);
      repository.findOwn.mockResolvedValue(
        ownRow({
          verificationStatus: 'REJECTED',
          rejectionReason: 'Decided earlier',
        }),
      );

      await expect(
        service.reject(admin, advisor.id, { reason: 'Second opinion' }),
      ).rejects.toThrow(
        new ConflictException(IDENTITY_VERIFICATION_MESSAGES.alreadyDecided),
      );
    });
  });

  describe("the advisor's own record", () => {
    it('answers the status and the outcome without the national id pair', async () => {
      repository.findOwn.mockResolvedValue(
        ownRow({
          verificationStatus: 'REJECTED',
          rejectionReason: 'The scan is unreadable',
        }),
      );

      const result = await service.getOwn(advisor);

      expect(result.verificationStatus).toBe('REJECTED');
      expect(result.rejectionReason).toBe('The scan is unreadable');
      // The guard that matters: nothing on the wire names either sensitive column, and
      // the owner is not told which admin ruled.
      expect(Object.keys(result)).toEqual([
        'advisorId',
        'verificationStatus',
        'documentObjectKey',
        'rejectionReason',
        'submittedAt',
        'verifiedAt',
      ]);
    });

    it('404s for an advisor who has never submitted', async () => {
      repository.findOwn.mockResolvedValue(undefined);

      await expect(service.getOwn(advisor)).rejects.toThrow(NotFoundException);
    });
  });
});
