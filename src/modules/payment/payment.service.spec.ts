import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { CreateInvoiceDto } from '@/modules/payment/dto/invoice.dto';
import type {
  CheckoutDto,
  CheckoutResponse,
} from '@/modules/payment/dto/checkout.dto';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import { PaymentServiceInvoicesRepository } from '@/modules/payment/payment.repository';
import { DRIZZLE } from '@/database/database.module';

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'frontendUrl') return 'https://frontend.app';
    if (key === 'backendUrl') return 'https://api.backend.app';
    return 'https://frontend.app';
  }),
};

const mockPaymentProvider = {
  getChargeStatus: jest.fn(),
  chargeSpecificCard: jest.fn(),
};

const mockInvoicesRepository = {
  findPublicById: jest.fn(),
  findWithServiceById: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
};

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
        { provide: 'PaymentConfig', useValue: mockPaymentConfig },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      expect(mockInvoicesRepository.updateById).toHaveBeenCalledWith(
        'uuid-invoice-1',
        { providerChargeId: 'ch_999' },
      );

      expect(result.url).toBe('https://3dsecure.gateway.com/verify');
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
