import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import { InternalServerErrorException } from '@nestjs/common';
import type { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { ChargeStatus } from '@/modules/payment/providers/providers';

jest.mock('@/mock/services', () => ({
  service: { priceSatang: 15000 },
}));

jest.mock('@/mock/appointments', () => ({
  appointmentPendingPayment: { id: 'appointment-123' },
}));

jest.mock('@/mock/invoices', () => ({
  invoicePending: { invoiceId: 'inv-456' },
}));

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentProvider: IPaymentProvider;

  const mockPaymentProvider = {
    chargeSpecificCard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: IPaymentProvider,
          useValue: mockPaymentProvider,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentProvider = module.get<IPaymentProvider>(IPaymentProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkout', () => {
    const mockUser = { id: 'user-1' } as SessionUser;
    const mockDto: CheckoutDto = {
      serviceId: 'e274e38f-de6f-42da-8098-b94221fd8dd9',
      startTimes: ['2023-01-01T00:00:00.000Z'],
      cardToken: 'tok_test_123',
    };

    it('should process checkout and return a Redirect on success', async () => {
      const mockChargeResult = {
        status: 'success',
        redirectUrl: 'https://omise.co/pay/123',
      };

      mockPaymentProvider.chargeSpecificCard.mockResolvedValue(
        mockChargeResult,
      );

      await service.checkout(mockUser, mockDto);

      expect(paymentProvider.chargeSpecificCard).toHaveBeenCalledTimes(1);

      expect(paymentProvider.chargeSpecificCard).toHaveBeenCalledWith(
        mockUser,
        15000,
        'tok_test_123',
        'http://localhost:3000/payments/verify/inv-456',
      );
    });

    it('should throw an InternalServerErrorException when charge fails', async () => {
      const mockChargeResult = {
        status: 'failed',
        errorCode: 'insufficient_funds',
        message: 'Insufficient Funds',
      };

      mockPaymentProvider.chargeSpecificCard.mockResolvedValue(
        mockChargeResult,
      );

      await expect(service.checkout(mockUser, mockDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      try {
        await service.checkout(mockUser, mockDto);
      } catch (error: unknown) {
        const chargeError = error as { response: ChargeStatus };
        expect(chargeError.response).toEqual(mockChargeResult);
      }
    });
  });
});
