import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminRefundCaseQueryDto } from './dtos/admin-refund-case-query.dto';
import type { RefundsRepository } from './refunds.repository';
import { RefundsService } from './refunds.service';
import type {
  AdminRefundCaseRow,
  RefundCase,
  RefundCaseEvidenceRow,
} from './refunds.types';

const advisee = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const admin = { id: '22222222-2222-2222-2222-222222222222' } as SessionUser;
const invoiceId = '33333333-3333-3333-3333-333333333333';
const refundCaseId = '44444444-4444-4444-4444-444444444444';
const createdAt = new Date('2026-09-01T00:00:00Z');

function makeRefundCase(overrides: Partial<RefundCase> = {}): RefundCase {
  return {
    id: refundCaseId,
    invoiceId,
    requestedByUserId: advisee.id,
    reviewedByAdminId: null,
    reason: 'The consultation never happened',
    status: 'OPEN',
    createdAt,
    resolvedAt: null,
    ...overrides,
  };
}

function makeAdminRow(
  overrides: Partial<AdminRefundCaseRow> = {},
): AdminRefundCaseRow {
  return {
    id: refundCaseId,
    invoiceId,
    requestedByUserId: advisee.id,
    requesterDisplayName: 'Nam',
    invoiceAmountSatang: 150000,
    reason: 'The consultation never happened',
    status: 'OPEN',
    reviewedByAdminId: null,
    createdAt,
    resolvedAt: null,
    ...overrides,
  };
}

const evidence: RefundCaseEvidenceRow = {
  objectKey: 'refund-evidence/44444444/receipt.png',
  originalFileName: 'receipt.png',
  mimeType: 'image/png',
  createdAt,
};

describe('RefundsService', () => {
  let service: RefundsService;
  let repository: jest.Mocked<
    Pick<
      RefundsRepository,
      | 'findDisputableInvoice'
      | 'openCaseExists'
      | 'create'
      | 'findManyForRequester'
      | 'countForRequester'
      | 'findManyForAdmin'
      | 'countForAdmin'
      | 'findOneForAdmin'
      | 'findEvidence'
      | 'findById'
      | 'ruleOpenCase'
    >
  >;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    repository = {
      findDisputableInvoice: jest.fn(),
      openCaseExists: jest.fn(),
      create: jest.fn(),
      findManyForRequester: jest.fn(),
      countForRequester: jest.fn(),
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      findEvidence: jest.fn(),
      findById: jest.fn(),
      ruleOpenCase: jest.fn(),
    };
    service = new RefundsService(repository as unknown as RefundsRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens a case against an invoice the caller paid for', async () => {
    repository.findDisputableInvoice.mockResolvedValue({
      id: invoiceId,
      amountSatang: 150000,
    });
    repository.openCaseExists.mockResolvedValue(false);
    repository.create.mockResolvedValue(makeRefundCase());

    await expect(
      service.open(advisee, {
        invoiceId,
        reason: 'The consultation never happened',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: refundCaseId }));

    expect(repository.findDisputableInvoice).toHaveBeenCalledWith(
      invoiceId,
      advisee.id,
    );
    expect(repository.create).toHaveBeenCalledWith({
      invoiceId,
      requestedByUserId: advisee.id,
      reason: 'The consultation never happened',
    });
  });

  it('refuses to open a case against an invoice the caller does not own', async () => {
    repository.findDisputableInvoice.mockResolvedValue(undefined);

    await expect(
      service.open(advisee, { invoiceId, reason: 'Not mine' }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.openCaseExists).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('checks ownership before looking for an existing case, so a stranger learns nothing', async () => {
    repository.findDisputableInvoice.mockResolvedValue(undefined);
    repository.openCaseExists.mockResolvedValue(true);

    await expect(
      service.open(advisee, { invoiceId, reason: 'Not mine' }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.openCaseExists).not.toHaveBeenCalled();
  });

  it('refuses a second open case on the same invoice', async () => {
    repository.findDisputableInvoice.mockResolvedValue({
      id: invoiceId,
      amountSatang: 150000,
    });
    repository.openCaseExists.mockResolvedValue(true);

    await expect(
      service.open(advisee, { invoiceId, reason: 'Again' }),
    ).rejects.toThrow(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('keeps the reviewing Admin out of the requester own-case view', async () => {
    repository.findManyForRequester.mockResolvedValue([
      makeRefundCase({
        status: 'REJECTED',
        reviewedByAdminId: admin.id,
        resolvedAt: createdAt,
      }),
    ]);
    repository.countForRequester.mockResolvedValue(1);
    const page = Object.assign(new OffsetPaginationDto(), {
      page: 1,
      limit: 20,
    });

    const result = await service.findMine(advisee, page);

    expect(result.items[0]).not.toHaveProperty('reviewedByAdminId');
    expect(repository.findManyForRequester).toHaveBeenCalledWith(advisee.id, {
      limit: 20,
      offset: 0,
    });
  });

  it('pages the Admin queue and counts it under the same status filter', async () => {
    repository.findManyForAdmin.mockResolvedValue([makeAdminRow()]);
    repository.countForAdmin.mockResolvedValue(1);
    const query = Object.assign(new AdminRefundCaseQueryDto(), {
      page: 1,
      limit: 20,
      status: 'OPEN' as const,
    });

    await expect(service.findManyForAdmin(query)).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: refundCaseId,
          requesterDisplayName: 'Nam',
          invoiceAmountSatang: 150000,
        }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(repository.findManyForAdmin).toHaveBeenCalledWith('OPEN', {
      limit: 20,
      offset: 0,
    });
    expect(repository.countForAdmin).toHaveBeenCalledWith('OPEN');
  });

  it('returns a case with its evidence rows', async () => {
    repository.findOneForAdmin.mockResolvedValue(makeAdminRow());
    repository.findEvidence.mockResolvedValue([evidence]);

    await expect(service.findOneForAdmin(refundCaseId)).resolves.toEqual(
      expect.objectContaining({
        id: refundCaseId,
        evidence: [expect.objectContaining({ objectKey: evidence.objectKey })],
      }),
    );
  });

  it('reports a case that does not exist as absent rather than empty', async () => {
    repository.findOneForAdmin.mockResolvedValue(undefined);
    repository.findEvidence.mockResolvedValue([]);

    await expect(service.findOneForAdmin(refundCaseId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('records the deciding Admin and the resolution time on approval', async () => {
    repository.findById.mockResolvedValue(makeRefundCase());
    repository.ruleOpenCase.mockResolvedValue(
      makeRefundCase({ status: 'APPROVED', reviewedByAdminId: admin.id }),
    );
    repository.findOneForAdmin.mockResolvedValue(
      makeAdminRow({ status: 'APPROVED', reviewedByAdminId: admin.id }),
    );

    await expect(service.approve(admin, refundCaseId)).resolves.toEqual(
      expect.objectContaining({
        status: 'APPROVED',
        reviewedByAdminId: admin.id,
      }),
    );
    expect(repository.ruleOpenCase).toHaveBeenCalledWith(
      refundCaseId,
      expect.objectContaining({
        status: 'APPROVED',
        reviewedByAdminId: admin.id,
      }),
    );
    const [, values] = repository.ruleOpenCase.mock.calls[0];
    expect(values.resolvedAt).toBeInstanceOf(Date);
  });

  it('refuses to approve a case that was already approved', async () => {
    repository.findById.mockResolvedValue(
      makeRefundCase({ status: 'APPROVED', reviewedByAdminId: admin.id }),
    );

    await expect(service.approve(admin, refundCaseId)).rejects.toThrow(
      ConflictException,
    );
    expect(repository.ruleOpenCase).not.toHaveBeenCalled();
  });

  it('refuses to reject a case that was already rejected', async () => {
    repository.findById.mockResolvedValue(
      makeRefundCase({ status: 'REJECTED', reviewedByAdminId: admin.id }),
    );

    await expect(
      service.reject(admin, refundCaseId, { reason: 'Outside policy' }),
    ).rejects.toThrow(ConflictException);
    expect(repository.ruleOpenCase).not.toHaveBeenCalled();
  });

  it('refuses a ruling that another Admin won the race for', async () => {
    repository.findById.mockResolvedValue(makeRefundCase());
    repository.ruleOpenCase.mockResolvedValue(undefined);

    await expect(service.approve(admin, refundCaseId)).rejects.toThrow(
      ConflictException,
    );
    expect(repository.findOneForAdmin).not.toHaveBeenCalled();
  });

  it('reports a ruling on a case that does not exist as absent', async () => {
    repository.findById.mockResolvedValue(undefined);

    await expect(service.approve(admin, refundCaseId)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.ruleOpenCase).not.toHaveBeenCalled();
  });

  it('rejects a case without writing the Admin reason the schema cannot hold', async () => {
    repository.findById.mockResolvedValue(makeRefundCase());
    repository.ruleOpenCase.mockResolvedValue(
      makeRefundCase({ status: 'REJECTED', reviewedByAdminId: admin.id }),
    );
    repository.findOneForAdmin.mockResolvedValue(
      makeAdminRow({ status: 'REJECTED', reviewedByAdminId: admin.id }),
    );

    await expect(
      service.reject(admin, refundCaseId, { reason: 'Outside policy' }),
    ).resolves.toEqual(expect.objectContaining({ status: 'REJECTED' }));

    expect(repository.ruleOpenCase).toHaveBeenCalledWith(
      refundCaseId,
      expect.objectContaining({
        status: 'REJECTED',
        reviewedByAdminId: admin.id,
      }),
    );
    const [, values] = repository.ruleOpenCase.mock.calls[0];
    expect(values.resolvedAt).toBeInstanceOf(Date);
    // The requester's own words are never overwritten by the Admin's.
    expect(values).not.toHaveProperty('reason');
  });
});
