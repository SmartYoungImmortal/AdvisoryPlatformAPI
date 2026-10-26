import { Test, type TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import type { Response } from 'express';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import type { CreateInvoiceDto } from '@/modules/payment/dto/invoice.dto';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockPaymentService = {
    checkout: jest.fn(),
    createInvoice: jest.fn(),
    getInvoiceById: jest.fn(),
    getPaymentStatus: jest.fn(),
    paymentCallback: jest.fn(),
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
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('postCheckout', () => {
    it('should call paymentService.checkout and return the result', async () => {
      const dto: CheckoutDto = { invoiceId: 'inv-123', cardToken: 'tok-123' };
      const expectedResult = { url: 'http://redirect.url/checkout' };
      mockPaymentService.checkout.mockResolvedValue(expectedResult);

      const result = await controller.postCheckout(mockUser, dto);

      expect(service.checkout).toHaveBeenCalledTimes(1);
      expect(service.checkout).toHaveBeenCalledWith(mockUser, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('postInvoice', () => {
    it('should call paymentService.createInvoice and return the created invoice', async () => {
      const dto: CreateInvoiceDto = {
        serviceId: 'svc-1',
        startTimes: ['2023-10-10T10:00:00Z'],
      };
      const expectedInvoice = {
        id: 'inv-123',
        amount: 1000,
        status: 'PENDING',
      };
      mockPaymentService.createInvoice.mockResolvedValue(expectedInvoice);

      const result = await controller.postInvoice(mockUser, dto);

      expect(service.createInvoice).toHaveBeenCalledTimes(1);
      expect(service.createInvoice).toHaveBeenCalledWith(mockUser, dto);
      expect(result).toEqual(expectedInvoice);
    });
  });

  describe('getInvoice', () => {
    it('should call paymentService.getInvoiceById and return the invoice details', async () => {
      const invoiceId = 'inv-uuid-123';
      const expectedInvoice = {
        id: invoiceId,
        amount: 1000,
        status: 'PENDING',
      };
      mockPaymentService.getInvoiceById.mockResolvedValue(expectedInvoice);

      const result = await controller.getInvoice(mockUser, invoiceId);

      expect(service.getInvoiceById).toHaveBeenCalledTimes(1);
      expect(service.getInvoiceById).toHaveBeenCalledWith(mockUser, invoiceId);
      expect(result).toEqual(expectedInvoice);
    });
  });

  describe('getPaymentStatus', () => {
    it('should call paymentService.getPaymentStatus and return the status object', async () => {
      const invoiceId = 'inv-uuid-123';
      const expectedStatus = {
        chargeStatus: 'SUCCESS',
        service: 'Consultation',
        appointments: [],
      };
      mockPaymentService.getPaymentStatus.mockResolvedValue(expectedStatus);

      const result = await controller.getPaymentStatus(mockUser, invoiceId);

      expect(service.getPaymentStatus).toHaveBeenCalledTimes(1);
      expect(service.getPaymentStatus).toHaveBeenCalledWith(
        mockUser,
        invoiceId,
      );
      expect(result).toEqual(expectedStatus);
    });
  });

  describe('checkoutCallback', () => {
    it('should call paymentService.paymentCallback and redirect the express response', async () => {
      const invoiceId = 'inv-uuid-123';
      const expectedUrl = 'http://localhost:4000/success';

      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      mockPaymentService.paymentCallback.mockResolvedValue({
        url: expectedUrl,
      });

      await controller.checkoutCallback(mockUser, invoiceId, mockResponse);

      expect(service.paymentCallback).toHaveBeenCalledTimes(1);
      expect(service.paymentCallback).toHaveBeenCalledWith(mockUser, invoiceId);

      expect(mockResponse.redirect).toHaveBeenCalledTimes(1);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.SEE_OTHER,
        expectedUrl,
      );
    });
  });
});
