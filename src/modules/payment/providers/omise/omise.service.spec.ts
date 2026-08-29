import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OmisePaymentProvider } from '@/modules/payment/providers/omise/omise.service';
import { OmiseRepository } from '@/modules/payment/providers/omise/omise.repository';
import { ENV_KEYS } from '@/config/env.constants';
import type { SessionUser } from '@/modules/auth/auth.config';
import Omise from 'omise';
import { TokenIdPrefix } from '@/modules/payment/providers/omise/types';

const mockCustomersUpdate = jest.fn();
const mockCustomersCreate = jest.fn();
const mockChargesCreate = jest.fn();

jest.mock('omise', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: mockCustomersCreate,
      update: mockCustomersUpdate,
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
    parse: jest.fn((val: string) => `Mocked message for ${val}`),
  },
}));

describe('OmisePaymentProvider', () => {
  let provider: OmisePaymentProvider;
  let omiseRepository: OmiseRepository;
  let configService: ConfigService;

  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test',
    fullName: 'Test User',
  } as SessionUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OmisePaymentProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === ENV_KEYS.OMISE_SECRET_KEY) return 'secret_key_123';
              if (key === ENV_KEYS.OMISE_PUBLIC_KEY) return 'public_key_123';
              if (key === ENV_KEYS.CURRENCY_CODE) return 'usd';
              return undefined;
            }),
          },
        },
        {
          provide: OmiseRepository,
          useValue: {
            recordOmiseCards: jest.fn(),
            getOmiseCustomer: jest.fn(),
            recordOmiseCustomer: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<OmisePaymentProvider>(OmisePaymentProvider);
    omiseRepository = module.get<OmiseRepository>(OmiseRepository);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Constructor', () => {
    it('should initialize Omise client correctly', () => {
      expect(Omise).toHaveBeenCalledWith({
        omiseVersion: '2019-05-29',
        secretKey: 'secret_key_123',
        publicKey: 'public_key_123',
      });
    });
  });

  describe('saveTokenToOmiseCustomer', () => {
    it('should update customer and record cards', async () => {
      const mockCustomerResponse = {
        cards: {
          data: [{ id: 'card_abc', created_at: '2023-01-01T00:00:00Z' }],
        },
      };
      mockCustomersUpdate.mockResolvedValueOnce(mockCustomerResponse);

      const result = await provider.saveTokenToOmiseCustomer(
        mockUser,
        'cust_123',
        `${TokenIdPrefix}_123`,
      );

      expect(mockCustomersUpdate).toHaveBeenCalledWith('cust_123', {
        card: `${TokenIdPrefix}_123`,
      });
      expect(omiseRepository.recordOmiseCards).toHaveBeenCalledWith(
        'user_123',
        ['card_abc'],
      );
      expect(result).toEqual(mockCustomerResponse);
    });
  });

  describe('getOmiseCustomerIdandSaveToken', () => {
    it('Branch 1: Existing Customer + Input is Token', async () => {
      jest.spyOn(omiseRepository, 'getOmiseCustomer').mockResolvedValueOnce({
        userId: 'fake_user_id',
        customerId: 'cust_exist',
      });

      const mockCustomerResponse = {
        cards: {
          data: [
            { id: 'card_older', created_at: '2023-01-01T00:00:00Z' },
            { id: 'card_newer', created_at: '2023-02-01T00:00:00Z' },
          ],
        },
      };
      mockCustomersUpdate.mockResolvedValueOnce(mockCustomerResponse);

      const result = await provider.getOmiseCustomerIdandSaveToken(
        mockUser,
        `${TokenIdPrefix}_abc`,
      );

      expect(result).toEqual({
        customerId: 'cust_exist',
        cardId: 'card_newer',
      });
      expect(mockCustomersUpdate).toHaveBeenCalledWith('cust_exist', {
        card: `${TokenIdPrefix}_abc`,
      });
    });

    it('Branch 2: Existing Customer + Input is Card', async () => {
      jest.spyOn(omiseRepository, 'getOmiseCustomer').mockResolvedValueOnce({
        userId: 'fake_user_id',
        customerId: 'cust_exist',
      });

      const result = await provider.getOmiseCustomerIdandSaveToken(
        mockUser,
        'card_123',
      );

      expect(result).toEqual({ customerId: 'cust_exist', cardId: 'card_123' });
      expect(mockCustomersUpdate).not.toHaveBeenCalled();
    });

    it('Branch 3: No Local Customer + Input is Card', async () => {
      jest
        .spyOn(omiseRepository, 'getOmiseCustomer')
        .mockResolvedValueOnce(undefined);

      await expect(
        provider.getOmiseCustomerIdandSaveToken(mockUser, 'card_123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        provider.getOmiseCustomerIdandSaveToken(mockUser, 'card_123'),
      ).rejects.toThrow('Card token expected');
    });

    it('Branch 4: No Local Customer + Input is Token', async () => {
      jest
        .spyOn(omiseRepository, 'getOmiseCustomer')
        .mockResolvedValueOnce(undefined);

      const mockCustomerCreateResponse = {
        id: 'cust_new',
        cards: {
          data: [{ id: 'card_new', created_at: '2023-01-01T00:00:00Z' }],
        },
      };
      mockCustomersCreate.mockResolvedValueOnce(mockCustomerCreateResponse);

      const result = await provider.getOmiseCustomerIdandSaveToken(
        mockUser,
        `${TokenIdPrefix}_new`,
      );

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        description: 'Name: Test; Full Name: Test User;',
        metadata: {
          userId: 'user_123',
        },
        card: `${TokenIdPrefix}_new`,
      });

      expect(omiseRepository.recordOmiseCustomer).toHaveBeenCalledWith(
        'user_123',
        'cust_new',
      );
      expect(omiseRepository.recordOmiseCards).toHaveBeenCalledWith(
        'user_123',
        ['card_new'],
      );

      expect(result).toEqual({ customerId: 'cust_new', cardId: 'card_new' });
    });
  });

  describe('chargeSpecificCard', () => {
    beforeEach(() => {
      jest
        .spyOn(omiseRepository, 'getOmiseCustomer')
        .mockResolvedValue({ userId: 'fake_user_id', customerId: 'cust_123' });
    });

    it('Branch 1: Success with Config Currency', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        authorize_uri: 'https://omise.co/redirect',
      });

      const result = await provider.chargeSpecificCard(
        mockUser,
        5000,
        'card_123',
        'https://my-app.com/callback',
      );

      expect(mockChargesCreate).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        customer: 'cust_123',
        card: 'card_123',
        return_uri: 'https://my-app.com/callback',
      });

      expect(result).toEqual({
        status: 'success',
        redirectUrl: 'https://omise.co/redirect',
      });
    });

    it('Branch 2: Success with Fallback Currency', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === ENV_KEYS.CURRENCY_CODE) return undefined;
        return 'mocked';
      });

      mockChargesCreate.mockResolvedValueOnce({ authorize_uri: 'url' });

      await provider.chargeSpecificCard(mockUser, 5000, 'card_123', 'url');

      expect(mockChargesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'thb',
        }),
      );
    });

    it('Branch 3: Omise API Failure Code', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        failure_code: 'insufficient_funds',
      });

      const result = await provider.chargeSpecificCard(
        mockUser,
        5000,
        'card_123',
        'url',
      );

      expect(result).toEqual({
        status: 'failed',
        errorCode: 'insufficient_funds',
        message: 'Mocked message for insufficient_funds',
      });
    });

    it('Branch 4: Try/Catch Error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const errorInstance = new Error('Network failure');
      mockChargesCreate.mockRejectedValueOnce(errorInstance);

      const result = await provider.chargeSpecificCard(
        mockUser,
        5000,
        'card_123',
        'url',
      );

      expect(consoleSpy).toHaveBeenCalledWith(errorInstance);
      expect(result).toEqual({
        status: 'failed',
        errorCode: 'unspecified',
        message: 'Mocked message for unspecified',
      });

      consoleSpy.mockRestore();
    });
  });
});
