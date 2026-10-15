import { ConflictException, NotFoundException } from '@nestjs/common';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminPayoutQueryDto } from './dtos/admin-payout-query.dto';
import type { PayoutsRepository } from './payouts.repository';
import { PayoutsService } from './payouts.service';
import type { AdminPayoutRow, Payout, PayoutInvoiceRow } from './payouts.types';

const advisor = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const payoutId = '55555555-5555-5555-5555-555555555555';
const invoiceId = '66666666-6666-6666-6666-666666666666';
const createdAt = new Date('2026-09-01T00:00:00Z');

function makePayout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: payoutId,
    advisorId: advisor.id,
    amountSatang: 150000,
    transferFeeSatang: 2000,
    providerTransferId: null,
    status: 'PENDING',
    createdAt,
    paidAt: null,
    ...overrides,
  };
}

function makeAdminRow(overrides: Partial<AdminPayoutRow> = {}): AdminPayoutRow {
  return {
    id: payoutId,
    advisorId: advisor.id,
    advisorDisplayName: 'Nam',
    amountSatang: 150000,
    transferFeeSatang: 2000,
    providerTransferId: null,
    status: 'PENDING',
    createdAt,
    paidAt: null,
    ...overrides,
  };
}

const coveredInvoice: PayoutInvoiceRow = {
  invoiceId,
  appointmentId: '77777777-7777-7777-7777-777777777777',
  amountSatang: 150000,
  platformFeeSatang: 15000,
  status: 'RELEASED',
  payoutEligibleAt: createdAt,
  createdAt,
};

describe('PayoutsService', () => {
  let service: PayoutsService;
  let repository: jest.Mocked<
    Pick<
      PayoutsRepository,
      | 'findManyForAdmin'
      | 'countForAdmin'
      | 'findOneForAdmin'
      | 'findInvoices'
      | 'findManyForAdvisor'
      | 'countForAdvisor'
      | 'findById'
      | 'settlePendingPayout'
    >
  >;

  beforeEach(() => {
    repository = {
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      findInvoices: jest.fn(),
      findManyForAdvisor: jest.fn(),
      countForAdvisor: jest.fn(),
      findById: jest.fn(),
      settlePendingPayout: jest.fn(),
    };
    service = new PayoutsService(repository as unknown as PayoutsRepository);
  });

  it('pages the queue and counts it under the same status and advisor filter', async () => {
    repository.findManyForAdmin.mockResolvedValue([makeAdminRow()]);
    repository.countForAdmin.mockResolvedValue(1);
    const query = Object.assign(new AdminPayoutQueryDto(), {
      page: 1,
      limit: 20,
      status: 'PENDING' as const,
      advisorId: advisor.id,
    });

    await expect(service.findManyForAdmin(query)).resolves.toEqual({
      items: [
        expect.objectContaining({ id: payoutId, advisorDisplayName: 'Nam' }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const filters = { status: 'PENDING', advisorId: advisor.id };
    expect(repository.findManyForAdmin).toHaveBeenCalledWith(filters, {
      limit: 20,
      offset: 0,
    });
    expect(repository.countForAdmin).toHaveBeenCalledWith(filters);
  });

  it('nets a payout by integer subtraction, never by dividing into baht', async () => {
    repository.findManyForAdvisor.mockResolvedValue([
      makePayout({ amountSatang: 150001, transferFeeSatang: 2000 }),
    ]);
    repository.countForAdvisor.mockResolvedValue(1);
    const page = Object.assign(new OffsetPaginationDto(), {
      page: 1,
      limit: 20,
    });

    const result = await service.findMine(advisor, page);

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        amountSatang: 150001,
        transferFeeSatang: 2000,
        netAmountSatang: 148001,
      }),
    );
    expect(Number.isInteger(result.items[0].netAmountSatang)).toBe(true);
    expect(repository.findManyForAdvisor).toHaveBeenCalledWith(advisor.id, {
      limit: 20,
      offset: 0,
    });
  });

  it('returns a payout with the invoices it covers and their integer total', async () => {
    repository.findOneForAdmin.mockResolvedValue(makeAdminRow());
    repository.findInvoices.mockResolvedValue([
      coveredInvoice,
      { ...coveredInvoice, invoiceId: 'other', amountSatang: 50000 },
    ]);

    await expect(service.findOneForAdmin(payoutId)).resolves.toEqual(
      expect.objectContaining({
        id: payoutId,
        invoicedTotalSatang: 200000,
        invoices: [
          expect.objectContaining({ invoiceId }),
          expect.objectContaining({ invoiceId: 'other' }),
        ],
      }),
    );
  });

  it('reports a payout that does not exist as absent rather than empty', async () => {
    repository.findOneForAdmin.mockResolvedValue(undefined);
    repository.findInvoices.mockResolvedValue([]);

    await expect(service.findOneForAdmin(payoutId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('stamps paidAt and the provider transfer id when a payout is marked paid', async () => {
    repository.findById.mockResolvedValue(makePayout());
    repository.settlePendingPayout.mockResolvedValue(
      makePayout({ status: 'PAID', paidAt: createdAt }),
    );
    repository.findOneForAdmin.mockResolvedValue(
      makeAdminRow({ status: 'PAID', paidAt: createdAt }),
    );

    await expect(
      service.markPaid(payoutId, { providerTransferId: 'trsf_test_1' }),
    ).resolves.toEqual(expect.objectContaining({ status: 'PAID' }));

    expect(repository.settlePendingPayout).toHaveBeenCalledWith(
      payoutId,
      expect.objectContaining({
        status: 'PAID',
        providerTransferId: 'trsf_test_1',
      }),
    );
    const [, values] = repository.settlePendingPayout.mock.calls[0];
    expect(values.paidAt).toBeInstanceOf(Date);
  });

  it('leaves an existing transfer id alone when the body omits one', async () => {
    repository.findById.mockResolvedValue(makePayout());
    repository.settlePendingPayout.mockResolvedValue(
      makePayout({ status: 'PAID', paidAt: createdAt }),
    );
    repository.findOneForAdmin.mockResolvedValue(
      makeAdminRow({ status: 'PAID', paidAt: createdAt }),
    );

    await service.markPaid(payoutId, {});

    const [, values] = repository.settlePendingPayout.mock.calls[0];
    expect(values).not.toHaveProperty('providerTransferId');
  });

  it('never stamps paidAt on a failed payout', async () => {
    repository.findById.mockResolvedValue(makePayout());
    repository.settlePendingPayout.mockResolvedValue(
      makePayout({ status: 'FAILED' }),
    );
    repository.findOneForAdmin.mockResolvedValue(
      makeAdminRow({ status: 'FAILED' }),
    );

    await expect(service.markFailed(payoutId)).resolves.toEqual(
      expect.objectContaining({ status: 'FAILED', paidAt: null }),
    );
    expect(repository.settlePendingPayout).toHaveBeenCalledWith(payoutId, {
      status: 'FAILED',
    });
  });

  it('refuses to settle a payout that was already paid', async () => {
    repository.findById.mockResolvedValue(
      makePayout({ status: 'PAID', paidAt: createdAt }),
    );

    await expect(service.markPaid(payoutId, {})).rejects.toThrow(
      ConflictException,
    );
    expect(repository.settlePendingPayout).not.toHaveBeenCalled();
  });

  it('refuses to settle a payout that already failed', async () => {
    repository.findById.mockResolvedValue(makePayout({ status: 'FAILED' }));

    await expect(service.markFailed(payoutId)).rejects.toThrow(
      ConflictException,
    );
    expect(repository.settlePendingPayout).not.toHaveBeenCalled();
  });

  it('refuses a settlement that another Admin won the race for', async () => {
    repository.findById.mockResolvedValue(makePayout());
    repository.settlePendingPayout.mockResolvedValue(undefined);

    await expect(service.markPaid(payoutId, {})).rejects.toThrow(
      ConflictException,
    );
    expect(repository.findOneForAdmin).not.toHaveBeenCalled();
  });

  it('reports a settlement on a payout that does not exist as absent', async () => {
    repository.findById.mockResolvedValue(undefined);

    await expect(service.markFailed(payoutId)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.settlePendingPayout).not.toHaveBeenCalled();
  });
});
