import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OmisePaymentProvider } from '@/modules/payment/providers/omise/omise.service';
import { OmiseRepository } from '@/modules/payment/providers/omise/omise.repository';
import { ENV_KEYS } from '@/config/env.constants';
import type { SessionUser } from '@/modules/auth/auth.config';

const mockCustomersCreate = jest.fn();
const mockChargesCreate = jest.fn();

jest.mock('omise', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: mockCustomersCreate,
    },
    charges: {
      create: mockChargesCreate,
    },
  }));
});

jest.mock('@/modules/payment/providers/providers', () => ({
  FailureCodeKeys: {
    parse: jest.fn((val: string) => val),
  },
  FailureCodeEnum: {
    parse: jest.fn((val) => `Mocked message for ${val}`),
  },
}));

describe('OmisePaymentProvider', () => {
  let provider: OmisePaymentProvider;
  let omiseRepository: OmiseRepository;

  const mockUser: SessionUser = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'John',
    fullName: 'John Doe',
  } as SessionUser;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case ENV_KEYS.OMISE_SECRET_KEY:
          return 'skey_test_123';
        case ENV_KEYS.OMISE_PUBLIC_KEY:
          return 'pkey_test_123';
        case ENV_KEYS.CURRENCY_CODE:
          return 'thb';
        default:
          return null;
      }
    }),
  };

  const mockOmiseRepository = {
    recordOmiseCustomer: jest.fn(),
    getOmiseCustomer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OmisePaymentProvider,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: OmiseRepository, useValue: mockOmiseRepository },
      ],
    }).compile();

    provider = module.get<OmisePaymentProvider>(OmisePaymentProvider);
    omiseRepository = module.get<OmiseRepository>(OmiseRepository);

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('createCustomerAndBindCard', () => {
    it('should create an omise customer and record the customerId in the repository', async () => {
      const cardToken = 'tok_test_123';
      const mockCustomerResponse = { id: 'cust_test_123' };
      mockCustomersCreate.mockResolvedValue(mockCustomerResponse);

      await provider.createCustomerAndBindCard(mockUser, cardToken);

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: mockUser.email,
        description: `Name: ${mockUser.name}; Full Name: ${mockUser.fullName};`,
        metadata: {
          userId: mockUser.id,
        },
        card: cardToken,
      });
      expect(omiseRepository.recordOmiseCustomer).toHaveBeenCalledWith(
        mockUser.id,
        mockCustomerResponse.id,
      );
    });
  });

  describe('chargeDefaultCard', () => {
    it('should throw BadRequestException if omise customer is not found', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue(null);

      await expect(provider.chargeDefaultCard(mockUser, 1000)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockOmiseRepository.getOmiseCustomer).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should return a success status if the charge is created without a failure_code', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue({
        customerId: 'cust_test_123',
      });
      mockChargesCreate.mockResolvedValue({
        id: 'chrg_test_123',
        failure_code: null,
      });

      const result = await provider.chargeDefaultCard(mockUser, 1000);

      expect(mockChargesCreate).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'thb',
        customer: 'cust_test_123',
      });
      expect(result).toEqual({ status: 'success' });
    });

    it('should return a failed status with parsed errorCode/message if charge has a failure_code', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue({
        customerId: 'cust_test_123',
      });
      mockChargesCreate.mockResolvedValue({
        id: 'chrg_test_123',
        failure_code: 'insufficient_funds',
      });

      const result = await provider.chargeDefaultCard(mockUser, 1000);

      expect(result).toEqual({
        status: 'failed',
        errorCode: 'insufficient_funds',
        message: 'Mocked message for insufficient_funds',
      });
    });

    it('should catch errors and return an unspecified failed status', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue({
        customerId: 'cust_test_123',
      });
      mockChargesCreate.mockRejectedValue(new Error('Network error'));

      const result = await provider.chargeDefaultCard(mockUser, 1000);

      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'failed',
        errorCode: 'unspecified',
        message: 'Mocked message for unspecified',
      });
    });
  });

  describe('chargeSpecificCard', () => {
    const cardId = 'card_test_123';

    it('should throw BadRequestException if omise customer is not found', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue(null);

      await expect(
        provider.chargeSpecificCard(mockUser, 1000, cardId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a success status if the charge is created for the specific card', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue({
        customerId: 'cust_test_123',
      });
      mockChargesCreate.mockResolvedValue({
        id: 'chrg_test_123',
        failure_code: null,
      });

      const result = await provider.chargeSpecificCard(mockUser, 1000, cardId);

      expect(mockChargesCreate).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'thb',
        customer: 'cust_test_123',
        card: cardId,
      });
      expect(result).toEqual({ status: 'success' });
    });

    it('should return a failed status if charge fails with a failure_code', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue({
        customerId: 'cust_test_123',
      });
      mockChargesCreate.mockResolvedValue({
        id: 'chrg_test_123',
        failure_code: 'stolen_card',
      });

      const result = await provider.chargeSpecificCard(mockUser, 1000, cardId);

      expect(result).toEqual({
        status: 'failed',
        errorCode: 'stolen_card',
        message: 'Mocked message for stolen_card',
      });
    });

    it('should catch errors and return an unspecified failed status', async () => {
      mockOmiseRepository.getOmiseCustomer.mockResolvedValue({
        customerId: 'cust_test_123',
      });
      mockChargesCreate.mockRejectedValue(new Error('API Timeout'));

      const result = await provider.chargeSpecificCard(mockUser, 1000, cardId);

      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'failed',
        errorCode: 'unspecified',
        message: 'Mocked message for unspecified',
      });
    });
  });
});
