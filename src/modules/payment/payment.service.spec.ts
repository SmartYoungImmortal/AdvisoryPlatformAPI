import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentService, couponDiscount } from './payment.service';

describe('couponDiscount', () => {
  it('takes a share of the price, rounded to the satang', () => {
    expect(
      couponDiscount({ percentOff: 10, amountOffSatang: null }, 80_000),
    ).toBe(8_000);
    expect(
      couponDiscount({ percentOff: 15, amountOffSatang: null }, 33_333),
    ).toBe(5_000);
  });

  it('takes a fixed amount, never more than the price', () => {
    expect(
      couponDiscount({ percentOff: null, amountOffSatang: 20_000 }, 80_000),
    ).toBe(20_000);
    expect(
      couponDiscount({ percentOff: null, amountOffSatang: 100_000 }, 80_000),
    ).toBe(80_000);
  });
});
import type { SessionUser } from '@/modules/auth/auth.config';
import type { CreateInvoiceDto } from '@/modules/payment/dto/invoice.dto';
import type {
  CheckoutDto,
  CheckoutResponse,
} from '@/modules/payment/dto/checkout.dto';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import {
  PaymentServiceInvoicesRepository,
  type AdviseeInvoiceRow,
} from '@/modules/payment/payment.repository';
import { DRIZZLE } from '@/database/database.module';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { BookingsService } from '@/modules/bookings/bookings.service';

const mockBookingsService = {
  confirmPayment: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string): string | undefined => {
    if (key === 'frontendUrl') return 'https://frontend.app';
    if (key === 'backendUrl') return 'https://api.backend.app';
    return 'https://frontend.app';
  }),
};

const mockPaymentProvider = {
  getChargeStatus: jest.fn(),
  chargeSpecificCard: jest.fn(),
  chargePromptPay: jest.fn(),
  chargeMobileBanking: jest.fn(),
};

const mockInvoicesRepository = {
  findPublicById: jest.fn(),
  findWithServiceById: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
  findManyForAdvisee: jest.fn(),
  findOneForAdvisee: jest.fn(),
  findForBooking: jest.fn(),
  countForAdvisee: jest.fn(),
  findAppointmentIds: jest.fn().mockResolvedValue([]),
};

/** A receipt row as the repository returns it; each test overrides what it is about. */
function receiptRow(
  invoice: Partial<AdviseeInvoiceRow['invoice']> = {},
  appointment: Partial<AdviseeInvoiceRow['appointment']> = {},
): AdviseeInvoiceRow {
  return {
    invoice: {
      id: 'uuid-invoice-1',
      invoiceNumber: 'INV-2026-000123',
      status: 'HELD_IN_ESCROW',
      amountSatang: 150000,
      platformFeeSatang: 30000,
      createdAt: new Date('2026-10-20T03:00:00.000Z'),
      paidAt: new Date('2026-10-20T03:02:00.000Z'),
      cardBrand: 'Visa',
      cardLastDigits: '4242',
      ...invoice,
    },
    service: { id: 'uuid-service-10', name: 'Tax planning' },
    advisor: { id: 'uuid-advisor-7', displayName: 'Araya' },
    appointment: {
      startTime: new Date('2026-10-25T03:00:00.000Z'),
      endTime: new Date('2026-10-25T04:00:00.000Z'),
      state: 'BOOKED',
      cancelledAt: null,
      ...appointment,
    },
  };
}

const mockTx = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  execute: jest.fn<Promise<unknown>, []>(),
  then: function (
    resolve: (value: unknown) => unknown,
    reject?: (reason: unknown) => unknown,
  ): Promise<unknown> {
    return this.execute().then(resolve, reject);
  },
};

const mockDrizzleDB = {
  transaction: jest.fn(
    async <T>(cb: (tx: typeof mockTx) => T | Promise<T>) => await cb(mockTx),
  ),
  // Reads outside a transaction (a coupon's preview) run on the same chain.
  select: jest.fn(() => mockTx),
};

const mockUser: SessionUser = {
  id: 'uuid-user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  email: 'test@example.com',
  emailVerified: true,
  name: 'Test',
  fullName: 'Test User',
  timezone: 'Asia/Bangkok',
  status: 'ACTIVE',
  banned: false,
};

const mockPaymentConfig = {
  invoice: { pendingLimit: 3 },
  redirectPaths: { success: '/success', failed: '/failed' },
};

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: IPaymentProvider, useValue: mockPaymentProvider },
        {
          provide: PaymentServiceInvoicesRepository,
          useValue: mockInvoicesRepository,
        },
        { provide: DRIZZLE, useValue: mockDrizzleDB },
        { provide: BookingsService, useValue: mockBookingsService },
        { provide: 'PaymentConfig', useValue: mockPaymentConfig },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMyBookingInvoice', () => {
    it('returns the linked receipt for an owned booking', async () => {
      mockInvoicesRepository.findForBooking.mockResolvedValue(receiptRow());
      await expect(
        service.findMyBookingInvoice(mockUser, 'booking-id'),
      ).resolves.toMatchObject({
        id: 'uuid-invoice-1',
        status: 'paid',
      });
    });
    it('returns 404 when the booking has no owned invoice', async () => {
      mockInvoicesRepository.findForBooking.mockResolvedValue(undefined);
      await expect(
        service.findMyBookingInvoice(mockUser, 'booking-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publicKey', () => {
    it('gives the public key, or nothing when card payments are not set up', () => {
      mockConfigService.get.mockReturnValueOnce('pkey_test_123');
      expect(service.publicKey()).toEqual({ publicKey: 'pkey_test_123' });
      expect(mockConfigService.get).toHaveBeenCalledWith('OMISE_PUBLIC_KEY');

      mockConfigService.get.mockReturnValueOnce(undefined);
      expect(service.publicKey()).toEqual({ publicKey: '' });
    });
  });

  /**
   * Each awaited read or write on the chain answers in turn: the booking, its
   * package or service, the coupon and its use count, the invoice already
   * waiting, then the writes.
   */
  const pending = {
    id: 'uuid-booking-1',
    state: 'PENDING_PAYMENT',
    serviceId: 'uuid-service-10',
    packageId: null as string | null,
  };
  const coupon = {
    id: 'uuid-coupon-1',
    code: 'ADVISORY10',
    percentOff: 10 as number | null,
    amountOffSatang: null as number | null,
    active: true,
    expiresAt: null as Date | null,
    maxRedemptions: null as number | null,
  };

  describe('previewCoupon', () => {
    beforeEach(() => {
      mockTx.execute.mockReset();
    });

    it('takes the coupon off the price of the package booked', async () => {
      mockTx.execute
        .mockResolvedValueOnce([{ ...pending, packageId: 'uuid-package-1' }])
        .mockResolvedValueOnce([{ priceSatang: 80_000 }])
        .mockResolvedValueOnce([coupon]);

      await expect(
        service.previewCoupon(mockUser, {
          bookingId: pending.id,
          code: ' advisory10 ',
        }),
      ).resolves.toEqual({
        code: 'ADVISORY10',
        priceSatang: 80_000,
        discountSatang: 8_000,
        amountSatang: 72_000,
      });
    });

    it('prices a service sold as itself, and counts a capped coupon’s uses', async () => {
      mockTx.execute
        .mockResolvedValueOnce([pending])
        .mockResolvedValueOnce([{ priceSatang: 50_000 }])
        .mockResolvedValueOnce([
          {
            ...coupon,
            percentOff: null,
            amountOffSatang: 20_000,
            maxRedemptions: 5,
          },
        ])
        .mockResolvedValueOnce([{ value: 4 }]);

      await expect(
        service.previewCoupon(mockUser, { bookingId: pending.id, code: 'X' }),
      ).resolves.toMatchObject({
        discountSatang: 20_000,
        amountSatang: 30_000,
      });
    });

    it('answers 404 for a booking that is not the Advisee’s', async () => {
      mockTx.execute.mockResolvedValueOnce([]);

      await expect(
        service.previewCoupon(mockUser, { bookingId: pending.id, code: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses a booking that is no longer waiting for payment', async () => {
      mockTx.execute.mockResolvedValueOnce([{ ...pending, state: 'BOOKED' }]);

      await expect(
        service.previewCoupon(mockUser, { bookingId: pending.id, code: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses a booking whose service is gone', async () => {
      mockTx.execute.mockResolvedValueOnce([pending]).mockResolvedValueOnce([]);

      await expect(
        service.previewCoupon(mockUser, { bookingId: pending.id, code: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });

    it.each([
      ['an unknown code', []],
      ['an inactive coupon', [{ ...coupon, active: false }]],
      [
        'an expired coupon',
        [{ ...coupon, expiresAt: new Date('2020-01-01T00:00:00.000Z') }],
      ],
    ])('refuses %s the same way', async (_name, rows) => {
      mockTx.execute
        .mockResolvedValueOnce([pending])
        .mockResolvedValueOnce([{ priceSatang: 50_000 }])
        .mockResolvedValueOnce(rows);

      await expect(
        service.previewCoupon(mockUser, { bookingId: pending.id, code: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses a coupon used as many times as it allows', async () => {
      mockTx.execute
        .mockResolvedValueOnce([pending])
        .mockResolvedValueOnce([{ priceSatang: 50_000 }])
        .mockResolvedValueOnce([{ ...coupon, maxRedemptions: 5 }])
        .mockResolvedValueOnce([{ value: 5 }]);

      await expect(
        service.previewCoupon(mockUser, { bookingId: pending.id, code: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBookingInvoice', () => {
    const waiting = {
      id: 'uuid-invoice-9',
      amountSatang: 50_000,
      platformFeeSatang: 10_000,
      createdAt: new Date('2026-10-30T03:00:00.000Z'),
      status: 'PENDING',
      couponId: null as string | null,
    };

    beforeEach(() => {
      mockTx.execute.mockReset();
    });

    it('returns the invoice already waiting on the booking at the same price', async () => {
      mockTx.execute
        .mockResolvedValueOnce([pending])
        .mockResolvedValueOnce([{ priceSatang: 50_000 }])
        .mockResolvedValueOnce([{ invoice: waiting }]);

      await expect(
        service.createBookingInvoice(mockUser, pending.id),
      ).resolves.toMatchObject({ id: waiting.id, amountSatang: 50_000 });
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it('retires a waiting invoice priced without the coupon and makes one with it', async () => {
      mockTx.execute
        .mockResolvedValueOnce([pending])
        .mockResolvedValueOnce([{ priceSatang: 50_000 }])
        .mockResolvedValueOnce([coupon])
        .mockResolvedValueOnce([{ invoice: waiting }])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([
          { ...waiting, id: 'uuid-invoice-10', amountSatang: 45_000 },
        ])
        .mockResolvedValueOnce(undefined);

      const invoice = await service.createBookingInvoice(
        mockUser,
        pending.id,
        'ADVISORY10',
      );

      expect(mockTx.set).toHaveBeenCalledWith({ status: 'FAILED' });
      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({
          amountSatang: 45_000,
          couponId: coupon.id,
          discountSatang: 5_000,
          status: 'PENDING',
        }),
      );
      expect(invoice).toMatchObject({ id: 'uuid-invoice-10' });
    });

    it('makes the first invoice of a booking at its full price', async () => {
      mockTx.execute
        .mockResolvedValueOnce([pending])
        .mockResolvedValueOnce([{ priceSatang: 50_000 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([waiting])
        .mockResolvedValueOnce(undefined);

      await expect(
        service.createBookingInvoice(mockUser, pending.id, '  '),
      ).resolves.toMatchObject({ id: waiting.id });
      expect(mockTx.set).not.toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({ couponId: null, discountSatang: 0 }),
      );
    });
  });

  describe('createInvoice', () => {
    const dto: CreateInvoiceDto = {
      serviceId: 'uuid-service-10',
      startTimes: ['2026-10-25T10:00:00.000Z', '2026-10-26T10:00:00.000Z'],
    };

    it('should successfully create a pending invoice and reserve slots (Happy Path)', async () => {
      mockTx.execute.mockResolvedValueOnce([]);
      mockTx.execute.mockResolvedValueOnce([{ value: 0 }]);
      mockTx.execute.mockResolvedValueOnce([
        { id: 'uuid-service-10', durationMinutes: 60, priceSatang: 100 },
      ]);
      mockTx.execute.mockResolvedValueOnce([{ value: 0 }]);
      mockTx.execute.mockResolvedValueOnce([{ value: 0 }]);
      mockTx.execute.mockResolvedValueOnce([
        { id: 'appt-1' },
        { id: 'appt-2' },
      ]);
      mockTx.execute.mockResolvedValueOnce([
        {
          id: 'uuid-invoice-99',
          amountSatang: 200,
          platformFeeSatang: 10,
          status: 'PENDING',
          createdAt: new Date(),
        },
      ]);
      mockTx.execute.mockResolvedValueOnce([]);

      const result = await service.createInvoice(mockUser, dto);

      expect(mockDrizzleDB.transaction).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'uuid-invoice-99');
      expect(result).toHaveProperty('status', 'PENDING');
    });

    it('should throw BadRequestException if startTimes contain duplicates', async () => {
      const duplicateDto: CreateInvoiceDto = {
        ...dto,
        startTimes: ['2026-10-25T10:00:00.000Z', '2026-10-25T10:00:00.000Z'],
      };

      await expect(
        service.createInvoice(mockUser, duplicateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user exceeds max pending invoices', async () => {
      mockTx.execute.mockResolvedValueOnce([]);
      mockTx.execute.mockResolvedValueOnce([{ value: 5 }]);
      await expect(service.createInvoice(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if serviceId does not exist', async () => {
      mockTx.execute.mockResolvedValueOnce([]);
      mockTx.execute.mockResolvedValueOnce([{ value: 0 }]);
      mockTx.execute.mockResolvedValueOnce([]);
      await expect(service.createInvoice(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if time slots overlap with existing appointments', async () => {
      mockTx.execute.mockResolvedValueOnce([]);
      mockTx.execute.mockResolvedValueOnce([{ value: 0 }]);
      mockTx.execute.mockResolvedValueOnce([
        { id: 'uuid-service-10', durationMinutes: 60, priceSatang: 100 },
      ]);
      mockTx.execute.mockResolvedValueOnce([{ value: 1 }]);
      mockTx.execute.mockResolvedValueOnce([{ value: 0 }]);
      await expect(service.createInvoice(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getInvoiceById', () => {
    const invoiceId = 'uuid-invoice-1';

    it('should return invoice details (Happy Path)', async () => {
      const mockInvoice = { id: invoiceId, amountSatang: 100 };
      mockInvoicesRepository.findPublicById.mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById(mockUser, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(mockInvoicesRepository.findPublicById).toHaveBeenCalledWith(
        invoiceId,
        mockUser.id,
      );
    });

    it('should throw NotFoundException if invoice does not exist or belong to user', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(null);

      await expect(service.getInvoiceById(mockUser, invoiceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMyInvoices', () => {
    it("pages the Advisee's own invoices and counts over the same owner", async () => {
      mockInvoicesRepository.findManyForAdvisee.mockResolvedValue([
        receiptRow(),
      ]);
      mockInvoicesRepository.countForAdvisee.mockResolvedValue(21);
      const page = new OffsetPaginationDto();
      page.page = 2;
      page.limit = 20;

      const result = await service.findMyInvoices(mockUser, page);

      expect(mockInvoicesRepository.findManyForAdvisee).toHaveBeenCalledWith(
        mockUser.id,
        { limit: 20, offset: 20 },
      );
      expect(mockInvoicesRepository.countForAdvisee).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toMatchObject({
        total: 21,
        page: 2,
        limit: 20,
        totalPages: 2,
      });
      expect(result.items).toHaveLength(1);
    });

    it('shapes a paid invoice into the receipt, and nothing else', async () => {
      mockInvoicesRepository.findManyForAdvisee.mockResolvedValue([
        receiptRow(),
      ]);
      mockInvoicesRepository.countForAdvisee.mockResolvedValue(1);

      const { items } = await service.findMyInvoices(
        mockUser,
        new OffsetPaginationDto(),
      );

      expect({ ...items[0] }).toEqual({
        id: 'uuid-invoice-1',
        invoiceNumber: 'INV-2026-000123',
        status: 'paid',
        amountSatang: 150000,
        platformFeeSatang: 30000,
        priceSatang: 120000,
        refundSatang: null,
        createdAt: new Date('2026-10-20T03:00:00.000Z'),
        paidAt: new Date('2026-10-20T03:02:00.000Z'),
        service: { id: 'uuid-service-10', name: 'Tax planning' },
        advisor: { id: 'uuid-advisor-7', displayName: 'Araya' },
        session: {
          startTime: new Date('2026-10-25T03:00:00.000Z'),
          endTime: new Date('2026-10-25T04:00:00.000Z'),
        },
        booking: 'confirmed',
        card: { brand: 'Visa', lastDigits: '4242' },
      });
    });

    it.each([
      ['PENDING', 'pending'],
      ['HELD_IN_ESCROW', 'paid'],
      ['RELEASED', 'paid'],
      ['REFUNDED', 'refunded'],
      ['FAILED', 'failed'],
    ] as const)('reports a %s invoice as %s', async (status, expected) => {
      mockInvoicesRepository.findManyForAdvisee.mockResolvedValue([
        receiptRow({ status }),
      ]);
      mockInvoicesRepository.countForAdvisee.mockResolvedValue(1);

      const { items } = await service.findMyInvoices(
        mockUser,
        new OffsetPaginationDto(),
      );

      expect(items[0].status).toBe(expected);
    });

    it('refunds the whole charge only on a refunded invoice', async () => {
      mockInvoicesRepository.findManyForAdvisee.mockResolvedValue([
        receiptRow({ status: 'REFUNDED' }),
        receiptRow({ status: 'RELEASED' }),
      ]);
      mockInvoicesRepository.countForAdvisee.mockResolvedValue(2);

      const { items } = await service.findMyInvoices(
        mockUser,
        new OffsetPaginationDto(),
      );

      expect(items.map((item) => item.refundSatang)).toEqual([150000, null]);
    });

    it.each([
      ['PENDING_PAYMENT', null, 'unconfirmed'],
      ['BOOKED', null, 'confirmed'],
      ['IN_PROGRESS', null, 'confirmed'],
      ['COMPLETED', null, 'confirmed'],
      ['NO_SHOW', null, 'confirmed'],
      ['CANCELLED', new Date('2026-10-21T00:00:00.000Z'), 'cancelled'],
      ['CANCELLED', null, 'cancelled'],
      ['BOOKED', new Date('2026-10-21T00:00:00.000Z'), 'cancelled'],
    ] as const)(
      'calls a %s appointment (cancelled at %s) %s',
      async (state, cancelledAt, expected) => {
        mockInvoicesRepository.findManyForAdvisee.mockResolvedValue([
          receiptRow({}, { state, cancelledAt }),
        ]);
        mockInvoicesRepository.countForAdvisee.mockResolvedValue(1);

        const { items } = await service.findMyInvoices(
          mockUser,
          new OffsetPaginationDto(),
        );

        expect(items[0].booking).toBe(expected);
      },
    );

    it('has no card until a charge named both its brand and last digits', async () => {
      mockInvoicesRepository.findManyForAdvisee.mockResolvedValue([
        receiptRow({ cardBrand: null, cardLastDigits: null, paidAt: null }),
        receiptRow({ cardBrand: null, cardLastDigits: '4242' }),
      ]);
      mockInvoicesRepository.countForAdvisee.mockResolvedValue(2);

      const { items } = await service.findMyInvoices(
        mockUser,
        new OffsetPaginationDto(),
      );

      expect(items.map((item) => item.card)).toEqual([null, null]);
      expect(items[0].paidAt).toBeNull();
    });
  });

  describe('findMyInvoice', () => {
    it("returns one of the user's own invoices as a receipt", async () => {
      mockInvoicesRepository.findOneForAdvisee.mockResolvedValue(
        receiptRow({ status: 'FAILED' }),
      );

      const receipt = await service.findMyInvoice(mockUser, 'uuid-invoice-1');

      expect(mockInvoicesRepository.findOneForAdvisee).toHaveBeenCalledWith(
        'uuid-invoice-1',
        mockUser.id,
      );
      expect(receipt).toMatchObject({
        id: 'uuid-invoice-1',
        status: 'failed',
        priceSatang: 120000,
      });
    });

    it("answers 404 for someone else's invoice or a missing one alike", async () => {
      mockInvoicesRepository.findOneForAdvisee.mockResolvedValue(undefined);

      await expect(
        service.findMyInvoice(mockUser, 'uuid-invoice-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentStatus', () => {
    const invoiceId = 'uuid-invoice-1';

    it('should fetch status, strip chargeId, and return aggregate info (Happy Path)', async () => {
      const mockDbInvoice = {
        invoice: {
          id: invoiceId,
          providerChargeId: 'ch_123',
        },
        service: { name: 'Consulting' },
        appointments: [],
      };

      mockInvoicesRepository.findWithServiceById.mockResolvedValue(
        mockDbInvoice,
      );
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        chargeId: 'ch_123',
        status: 'success',
        paidAt: new Date(),
      });

      const result = await service.getPaymentStatus(mockUser, invoiceId);

      expect(mockPaymentProvider.getChargeStatus).toHaveBeenCalledWith(
        'ch_123',
      );
      expect(result.chargeStatus.status).toBe('success');
      expect(result.chargeStatus).not.toHaveProperty('chargeId');
      expect(result).toHaveProperty('service');
    });

    it('should throw NotFoundException if invoice is not found', async () => {
      mockInvoicesRepository.findWithServiceById.mockResolvedValue(null);

      await expect(
        service.getPaymentStatus(mockUser, invoiceId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if invoice has no providerChargeId', async () => {
      mockInvoicesRepository.findWithServiceById.mockResolvedValue({
        invoice: {
          id: invoiceId,
          providerChargeId: null,
        },
      });

      await expect(
        service.getPaymentStatus(mockUser, invoiceId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('payByPromptPay', () => {
    const invoiceId = 'uuid-invoice-1';
    const waiting = {
      id: invoiceId,
      amountSatang: 72_000,
      status: 'PENDING',
    };

    it('charges the invoice by a QR code and keeps the charge on it', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(waiting);
      mockPaymentProvider.chargePromptPay.mockResolvedValue({
        status: 'pending',
        chargeId: 'chrg_pp1',
        qrImageUrl: 'https://api.omise.co/qr.svg',
        expiresAt: '2026-10-30T10:15:00.000Z',
      });

      await expect(
        service.payByPromptPay(mockUser, { invoiceId }),
      ).resolves.toEqual({
        qrImageUrl: 'https://api.omise.co/qr.svg',
        amountSatang: 72_000,
        expiresAt: '2026-10-30T10:15:00.000Z',
      });
      expect(mockPaymentProvider.chargePromptPay).toHaveBeenCalledWith(
        72_000,
        expect.any(Date),
      );
      expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
        invoiceId,
        {
          providerChargeId: 'chrg_pp1',
          cardBrand: 'PromptPay',
          cardLastDigits: null,
          paidAt: null,
        },
      );
    });

    it('answers 404 for an invoice that is not the user’s', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(undefined);

      await expect(
        service.payByPromptPay(mockUser, { invoiceId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses an invoice that is no longer waiting for payment', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue({
        ...waiting,
        status: 'HELD_IN_ESCROW',
      });

      await expect(
        service.payByPromptPay(mockUser, { invoiceId }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPaymentProvider.chargePromptPay).not.toHaveBeenCalled();
    });

    it('stores nothing when the provider refuses the charge', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(waiting);
      mockPaymentProvider.chargePromptPay.mockResolvedValue({
        status: 'failed',
        errorCode: 'unspecified',
        message: 'Other unspecified error.',
      });

      await expect(
        service.payByPromptPay(mockUser, { invoiceId }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockInvoicesRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('payByMobileBanking', () => {
    const invoiceId = 'uuid-invoice-1';
    const waiting = {
      id: invoiceId,
      amountSatang: 72_000,
      status: 'PENDING',
    };

    it('charges the invoice in the bank’s app and returns the page that opens it', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(waiting);
      mockPaymentProvider.chargeMobileBanking.mockResolvedValue({
        status: 'pending',
        chargeId: 'chrg_mb1',
        authorizeUri: 'https://pay.omise.co/payments/pay2_test/authorize',
      });

      await expect(
        service.payByMobileBanking(mockUser, {
          invoiceId,
          bank: 'kbank',
          platform: 'IOS',
        }),
      ).resolves.toEqual({
        url: 'https://pay.omise.co/payments/pay2_test/authorize',
      });
      // Returned to the same place as a card's 3-D Secure.
      expect(mockPaymentProvider.chargeMobileBanking).toHaveBeenCalledWith(
        72_000,
        'kbank',
        'IOS',
        expect.stringMatching(new RegExp(`/${invoiceId}$`)),
      );
      expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
        invoiceId,
        {
          providerChargeId: 'chrg_mb1',
          cardBrand: 'K PLUS',
          cardLastDigits: null,
          paidAt: null,
        },
      );
    });

    it('answers 404 for an invoice that is not the user’s', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(undefined);

      await expect(
        service.payByMobileBanking(mockUser, { invoiceId, bank: 'scb' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses an invoice that is no longer waiting for payment', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue({
        ...waiting,
        status: 'HELD_IN_ESCROW',
      });

      await expect(
        service.payByMobileBanking(mockUser, { invoiceId, bank: 'scb' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPaymentProvider.chargeMobileBanking).not.toHaveBeenCalled();
    });

    it('stores nothing when the provider refuses the charge', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(waiting);
      mockPaymentProvider.chargeMobileBanking.mockResolvedValue({
        status: 'failed',
        errorCode: 'unspecified',
        message: 'Other unspecified error.',
      });

      await expect(
        service.payByMobileBanking(mockUser, { invoiceId, bank: 'bbl' }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockInvoicesRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('promptPayStatus', () => {
    const invoiceId = 'uuid-invoice-1';

    it('is pending, with nowhere to go yet, until the code is paid', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue({
        id: invoiceId,
      });
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'chrg_pp1',
        paidAt: null,
      });
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        status: 'pending',
      });

      await expect(
        service.promptPayStatus(mockUser, invoiceId),
      ).resolves.toEqual({ status: 'pending', url: null });
      expect(mockInvoicesRepository.updateById).not.toHaveBeenCalled();
    });

    it('records a paid code, books its bookings and leads to the success page', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue({
        id: invoiceId,
      });
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'chrg_pp1',
        paidAt: null,
      });
      mockInvoicesRepository.findAppointmentIds.mockResolvedValue([
        'uuid-booking-1',
      ]);
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        status: 'success',
        brand: 'PromptPay',
        lastDigits: '',
      });

      const result = await service.promptPayStatus(mockUser, invoiceId);

      expect(result.status).toBe('success');
      expect(result.url).toContain(`invoiceId=${invoiceId}`);
      expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
        invoiceId,
        expect.objectContaining({
          cardBrand: 'PromptPay',
          status: 'HELD_IN_ESCROW',
        }),
      );
      expect(mockBookingsService.confirmPayment).toHaveBeenCalledWith(
        'uuid-booking-1',
      );
    });

    it('answers 404 for an invoice that is not the user’s or was never charged', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(undefined);
      await expect(
        service.promptPayStatus(mockUser, invoiceId),
      ).rejects.toThrow(NotFoundException);
      expect(mockInvoicesRepository.findById).not.toHaveBeenCalled();

      mockInvoicesRepository.findPublicById.mockResolvedValue({
        id: invoiceId,
      });
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: null,
      });
      await expect(
        service.promptPayStatus(mockUser, invoiceId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('paymentCallback', () => {
    const invoiceId = 'uuid-invoice-1';

    it('should return correct frontend redirect URL on success (Happy Path)', async () => {
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'ch_123',
      });
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        status: 'success',
      });

      const result = await service.paymentCallback(mockUser, invoiceId);

      expect(result.url).toContain('https://frontend.app');
      expect(result.url).toContain(`invoiceId=${invoiceId}`);
    });

    it.each([
      ['success', 'HELD_IN_ESCROW'],
      ['failed', 'FAILED'],
    ] as const)(
      'records a %s outcome: the card it names, when it was known, and the invoice as %s',
      async (status, invoiceStatus) => {
        mockInvoicesRepository.findById.mockResolvedValue({
          id: invoiceId,
          providerChargeId: 'ch_123',
          paidAt: null,
        });
        mockInvoicesRepository.findAppointmentIds.mockResolvedValue([]);
        mockPaymentProvider.getChargeStatus.mockResolvedValue({
          status,
          brand: 'Visa',
          lastDigits: '4242',
        });

        await service.paymentCallback(mockUser, invoiceId);

        expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
          invoiceId,
          {
            cardBrand: 'Visa',
            cardLastDigits: '4242',
            paidAt: expect.any(Date) as Date,
            status: invoiceStatus,
          },
        );
      },
    );

    it('confirms every booking a paid invoice pays for', async () => {
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'ch_123',
        paidAt: null,
      });
      mockInvoicesRepository.findAppointmentIds.mockResolvedValue([
        'uuid-booking-1',
        'uuid-booking-2',
      ]);
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        status: 'success',
        brand: 'Visa',
        lastDigits: '4242',
      });

      await service.paymentCallback(mockUser, invoiceId);

      expect(mockBookingsService.confirmPayment).toHaveBeenNthCalledWith(
        1,
        'uuid-booking-1',
      );
      expect(mockBookingsService.confirmPayment).toHaveBeenNthCalledWith(
        2,
        'uuid-booking-2',
      );
    });

    it('confirms no booking when the charge was declined or is still pending', async () => {
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'ch_123',
        paidAt: null,
      });
      mockInvoicesRepository.findAppointmentIds.mockResolvedValue([
        'uuid-booking-1',
      ]);
      for (const status of ['failed', 'pending'] as const) {
        mockPaymentProvider.getChargeStatus.mockResolvedValue({
          status,
          brand: 'Visa',
          lastDigits: '4242',
        });
        await service.paymentCallback(mockUser, invoiceId);
      }

      expect(mockBookingsService.confirmPayment).not.toHaveBeenCalled();
    });

    it('keeps the first recorded moment when the return page is reloaded', async () => {
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'ch_123',
        paidAt: new Date('2026-10-20T03:02:00.000Z'),
      });
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        status: 'success',
        brand: 'Visa',
        lastDigits: '4242',
      });

      await service.paymentCallback(mockUser, invoiceId);

      expect(mockInvoicesRepository.updateById).not.toHaveBeenCalled();
    });

    it('records nothing while the charge is still pending', async () => {
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'ch_123',
        paidAt: null,
      });
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        status: 'pending',
      });

      await service.paymentCallback(mockUser, invoiceId);

      expect(mockInvoicesRepository.updateById).not.toHaveBeenCalled();
    });

    it('stores an unknown card, not a blank one, when the provider never reached it', async () => {
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: 'ch_123',
        paidAt: null,
      });
      mockPaymentProvider.getChargeStatus.mockResolvedValue({
        status: 'failed',
        brand: '',
        lastDigits: '',
        errorCode: 'unspecified',
      });

      await service.paymentCallback(mockUser, invoiceId);

      expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
        invoiceId,
        expect.objectContaining({ cardBrand: null, cardLastDigits: null }),
      );
    });

    it('should throw NotFoundException if invoice missing or lacks chargeId', async () => {
      mockInvoicesRepository.findById.mockResolvedValue({
        id: invoiceId,
        providerChargeId: null,
      });

      await expect(
        service.paymentCallback(mockUser, invoiceId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkout', () => {
    const dto: CheckoutDto = {
      invoiceId: 'uuid-invoice-1',
      cardToken: 'tok_123',
    };

    it('should initiate charge, update invoice, and return redirectUrl (Happy Path)', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue({
        id: 'uuid-invoice-1',
        amountSatang: 500,
      });
      mockPaymentProvider.chargeSpecificCard.mockResolvedValue({
        status: 'success',
        brand: 'MasterCard',
        lastDigits: '5454',
        chargeId: 'ch_999',
        redirectUrl: 'https://3dsecure.gateway.com/verify',
      });

      const result: CheckoutResponse = await service.checkout(mockUser, dto);

      expect(mockPaymentProvider.chargeSpecificCard).toHaveBeenCalledWith(
        mockUser,
        500,
        'tok_123',
        expect.any(String),
      );
      // The card is known once the charge exists; its outcome is left for the callback.
      expect(mockInvoicesRepository.updateById).toHaveBeenCalledTimes(1);
      expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
        'uuid-invoice-1',
        {
          providerChargeId: 'ch_999',
          cardBrand: 'MasterCard',
          cardLastDigits: '5454',
          paidAt: null,
        },
      );

      expect(result.url).toBe('https://3dsecure.gateway.com/verify');
    });

    it('records a declined charge as a dated failure on its card, then reports it', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue({
        id: 'uuid-invoice-1',
        amountSatang: 500,
      });
      mockPaymentProvider.chargeSpecificCard.mockResolvedValue({
        status: 'failed',
        brand: 'Visa',
        lastDigits: '0002',
        errorCode: 'payment_rejected',
        message: 'Payment rejected by issuer.',
      });

      await expect(service.checkout(mockUser, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
        'uuid-invoice-1',
        {
          cardBrand: 'Visa',
          cardLastDigits: '0002',
          paidAt: expect.any(Date) as Date,
        },
      );
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue(null);

      await expect(service.checkout(mockUser, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if charge status is not exactly "success"', async () => {
      mockInvoicesRepository.findPublicById.mockResolvedValue({
        id: 'uuid-invoice-1',
        amountSatang: 500,
      });
      mockPaymentProvider.chargeSpecificCard.mockResolvedValue({
        status: 'pending',
        chargeId: 'ch_999',
      });

      await expect(service.checkout(mockUser, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
