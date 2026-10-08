import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import { IdentityVerificationQueryDto } from './dtos/identity-verification-query.dto';
import type { IdentityVerificationRow } from './dtos/identity-verification-response.dto';
import type { OwnIdentityVerificationRow } from './dtos/own-identity-verification-response.dto';
import { IDENTITY_VERIFICATION_MESSAGES } from './identity-verification.constants';
import type { IdentityVerificationRepository } from './identity-verification.repository';
import {
  IdentityVerificationService,
  type IdentityDocumentUpload,
} from './identity-verification.service';

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

function scan(overrides: Partial<IdentityDocumentUpload> = {}) {
  return {
    buffer: Buffer.from('id-card'),
    mimetype: 'image/jpeg',
    size: 7,
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
      | 'approve'
      | 'applicationExists'
      | 'submit'
    >
  >;
  let storage: jest.Mocked<
    Pick<SeaweedFsStorageService, 'putObject' | 'removeObject'>
  >;
  let service: IdentityVerificationService;

  beforeEach(() => {
    repository = {
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      findOwn: jest.fn(),
      decide: jest.fn(),
      approve: jest.fn(),
      applicationExists: jest.fn().mockResolvedValue(true),
      submit: jest.fn(),
    };
    storage = {
      putObject: jest.fn().mockResolvedValue(undefined),
      removeObject: jest.fn().mockResolvedValue(undefined),
    };
    service = new IdentityVerificationService(
      repository as unknown as IdentityVerificationRepository,
      storage as unknown as SeaweedFsStorageService,
    );
  });

  describe('submit', () => {
    const submittedAt = new Date('2026-03-01T00:00:00Z');

    it('stores the scan under the applicant, then puts the record up for review', async () => {
      repository.submit.mockResolvedValue({
        submittedAt,
        previousDocumentObjectKey: null,
      });

      const result = await service.submit(advisor, scan());

      const stored = storage.putObject.mock.calls[0][0];
      expect(stored.key).toMatch(
        new RegExp(`^identity/${advisor.id}/[0-9a-f-]{36}\\.jpg$`),
      );
      expect(stored.contentType).toBe('image/jpeg');
      expect(repository.submit).toHaveBeenCalledWith(advisor.id, stored.key, [
        'NONE',
        'REJECTED',
      ]);
      // Status and time only — never the key or a URL.
      expect(result).toEqual({ verificationStatus: 'SUBMITTED', submittedAt });
      expect(storage.removeObject).not.toHaveBeenCalled();
    });

    it('removes the document a resubmission replaces', async () => {
      repository.submit.mockResolvedValue({
        submittedAt,
        previousDocumentObjectKey: 'identity/advisor/rejected.png',
      });

      await service.submit(advisor, scan({ mimetype: 'image/png' }));

      expect(storage.removeObject).toHaveBeenCalledWith(
        'identity/advisor/rejected.png',
      );
    });

    it.each([
      [
        'no file at all',
        undefined,
        IDENTITY_VERIFICATION_MESSAGES.documentRequired,
      ],
      [
        'an empty file',
        scan({ size: 0 }),
        IDENTITY_VERIFICATION_MESSAGES.documentRequired,
      ],
      [
        'a PDF, which Stage 2 does not accept',
        scan({ mimetype: 'application/pdf' }),
        IDENTITY_VERIFICATION_MESSAGES.documentInvalidType,
      ],
      [
        'a file over 50 MB',
        scan({ size: 50 * 1024 * 1024 + 1 }),
        IDENTITY_VERIFICATION_MESSAGES.documentTooLarge,
      ],
    ])(
      'refuses %s before touching storage',
      async (_label, upload, message) => {
        await expect(service.submit(advisor, upload)).rejects.toThrow(
          new BadRequestException(message),
        );
        expect(storage.putObject).not.toHaveBeenCalled();
      },
    );

    it('404s for a user who has not applied, before touching storage', async () => {
      repository.applicationExists.mockResolvedValue(false);

      await expect(service.submit(advisor, scan())).rejects.toThrow(
        new NotFoundException(
          IDENTITY_VERIFICATION_MESSAGES.applicationRequired,
        ),
      );
      expect(storage.putObject).not.toHaveBeenCalled();
    });

    it('503s when storage is down, and writes no record', async () => {
      storage.putObject.mockRejectedValue(new Error('connection refused'));

      await expect(service.submit(advisor, scan())).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(repository.submit).not.toHaveBeenCalled();
    });

    it.each([
      ['SUBMITTED', IDENTITY_VERIFICATION_MESSAGES.awaitingReview],
      ['VERIFIED', IDENTITY_VERIFICATION_MESSAGES.alreadyVerified],
    ] as const)(
      'conflicts from %s and removes the object it just stored',
      async (status, message) => {
        repository.submit.mockResolvedValue(undefined);
        repository.findOwn.mockResolvedValue(
          ownRow({ verificationStatus: status }),
        );

        await expect(service.submit(advisor, scan())).rejects.toThrow(
          new ConflictException(message),
        );
        expect(storage.removeObject).toHaveBeenCalledWith(
          storage.putObject.mock.calls[0][0].key,
        );
      },
    );

    it('removes the stored object when the record write fails', async () => {
      repository.submit.mockRejectedValue(new Error('database down'));

      await expect(service.submit(advisor, scan())).rejects.toThrow(
        'database down',
      );
      expect(storage.removeObject).toHaveBeenCalledWith(
        storage.putObject.mock.calls[0][0].key,
      );
    });

    it('still answers when removing a replaced document fails', async () => {
      repository.submit.mockResolvedValue({
        submittedAt,
        previousDocumentObjectKey: 'identity/advisor/rejected.png',
      });
      storage.removeObject.mockRejectedValue(new Error('gone away'));

      await expect(service.submit(advisor, scan())).resolves.toEqual({
        verificationStatus: 'SUBMITTED',
        submittedAt,
      });
    });
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
    it('writes the outcome, the time and the deciding admin through the role-granting write', async () => {
      repository.approve.mockResolvedValue(true);
      repository.findOneForAdmin.mockResolvedValue(
        queueRow({
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date('2026-02-01T00:00:00Z'),
          verifiedByAdminId: admin.id,
        }),
      );

      const result = await service.approve(admin, advisor.id);

      // `approve`, not `decide`: it is the repository write that also sets
      // `user.role = 'advisor'` in the same transaction.
      expect(repository.decide).not.toHaveBeenCalled();
      expect(repository.approve).toHaveBeenCalledWith(
        advisor.id,
        ['SUBMITTED'],
        expect.objectContaining({
          verificationStatus: 'VERIFIED',
          verifiedByAdminId: admin.id,
          rejectionReason: null,
        }),
      );
      expect(repository.approve.mock.calls[0][2].verifiedAt).toBeInstanceOf(
        Date,
      );
      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.verifiedByAdminId).toBe(admin.id);
    });

    it('conflicts on a record that has already been decided', async () => {
      repository.approve.mockResolvedValue(false);
      repository.findOwn.mockResolvedValue(
        ownRow({ verificationStatus: 'VERIFIED' }),
      );

      await expect(service.approve(admin, advisor.id)).rejects.toThrow(
        new ConflictException(IDENTITY_VERIFICATION_MESSAGES.alreadyDecided),
      );
      expect(repository.findOneForAdmin).not.toHaveBeenCalled();
    });

    it('conflicts with its own message on a record nobody has submitted', async () => {
      repository.approve.mockResolvedValue(false);
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
      repository.approve.mockResolvedValue(false);
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
      // A rejection grants nothing.
      expect(repository.approve).not.toHaveBeenCalled();
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
