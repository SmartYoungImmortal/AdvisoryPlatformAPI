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
const mockChargesRetrieve = jest.fn();
const mockTokensRetrieve = jest.fn();

jest.mock('omise', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: mockCustomersCreate,
      update: mockCustomersUpdate,
    },
    charges: {
      create: mockChargesCreate,
      retrieve: mockChargesRetrieve,
    },
    tokens: {
      retrieve: mockTokensRetrieve,
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
  PROMPTPAY_BRAND: 'PromptPay',
  MOBILE_BANKS: { scb: 'SCB EASY', kbank: 'K PLUS' },
}));

jest.mock('@/modules/payment/providers/omise/utils', () => ({
  createOmiseCustomer: jest.fn((): Record<string, never> => ({})),
  getCardIds: jest.fn((cards: Array<{ id: string }>): string[] =>
    cards.map(({ id }) => id),
  ),
  sortCardsDescendingAddDate: jest.fn(
    (cards: Array<{ id: string }>): Array<{ id: string }> => cards,
  ),
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
        cardId: 'card_older',
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

      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          card: `${TokenIdPrefix}_new`,
        }),
      );

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
        id: 'chrg_test123',
        authorize_uri: 'https://omise.co/redirect',
        card: {
          brand: 'Visa',
          last_digits: '1234',
        },
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
        brand: 'Visa',
        lastDigits: '1234',
        redirectUrl: 'https://omise.co/redirect',
        chargeId: 'chrg_test123',
      });
    });

    it('Branch 2: Success with Fallback Currency', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === ENV_KEYS.CURRENCY_CODE) return undefined;
        return 'mocked';
      });

      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_test456',
        authorize_uri: 'url',
        card: {
          last_digits: '4567',
        },
      });

      await provider.chargeSpecificCard(mockUser, 5000, 'card_123', 'url');

      expect(mockChargesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'thb',
        }),
      );
    });

    it('charges a Google Pay token as itself, never saving it to the customer', async () => {
      const tokenId = `${TokenIdPrefix}_googlepay`;
      mockTokensRetrieve.mockResolvedValueOnce({
        id: tokenId,
        card: { tokenization_method: 'googlepay' },
      });
      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_wallet',
        authorize_uri: 'https://omise.co/redirect',
        card: { brand: 'Visa', last_digits: '1111' },
      });

      const result = await provider.chargeSpecificCard(
        mockUser,
        5000,
        tokenId,
        'url',
      );

      expect(mockTokensRetrieve).toHaveBeenCalledWith(tokenId);
      expect(mockCustomersUpdate).not.toHaveBeenCalled();
      expect(mockCustomersCreate).not.toHaveBeenCalled();
      expect(mockChargesCreate).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        card: tokenId,
        return_uri: 'url',
      });
      expect(result).toMatchObject({ status: 'success', lastDigits: '1111' });
    });

    it('saves a typed card token to the customer, as before', async () => {
      const tokenId = `${TokenIdPrefix}_typed`;
      mockTokensRetrieve.mockResolvedValueOnce({
        id: tokenId,
        card: { tokenization_method: null },
      });
      mockCustomersUpdate.mockResolvedValueOnce({
        id: 'cust_123',
        cards: { data: [{ id: 'card_saved' }] },
      });
      jest.spyOn(omiseRepository, 'recordOmiseCards').mockResolvedValue([]);
      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_typed',
        authorize_uri: 'url',
        card: { brand: 'Visa', last_digits: '4242' },
      });

      await provider.chargeSpecificCard(mockUser, 5000, tokenId, 'url');

      expect(mockCustomersUpdate).toHaveBeenCalledWith('cust_123', {
        card: tokenId,
      });
      expect(mockChargesCreate).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cust_123', card: 'card_saved' }),
      );
    });

    it('Branch 3: Omise API Failure Code', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        failure_code: 'insufficient_funds',
        card: {
          brand: 'MasterCard',
          last_digits: '9999',
        },
      });

      const result = await provider.chargeSpecificCard(
        mockUser,
        5000,
        'card_123',
        'url',
      );

      expect(result).toEqual({
        status: 'failed',
        brand: 'MasterCard',
        lastDigits: '9999',
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
        brand: '',
        lastDigits: '',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('chargePromptPay', () => {
    const expiresAt = new Date('2026-10-30T10:15:00.000Z');

    it('makes a PromptPay charge that expires when asked and gives its QR code', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_pp1',
        status: 'pending',
        source: {
          type: 'promptpay',
          scannable_code: {
            image: { download_uri: 'https://api.omise.co/qr.svg' },
          },
        },
      });

      const result = await provider.chargePromptPay(80_000, expiresAt);

      expect(mockChargesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 80_000,
          source: expect.objectContaining({ type: 'promptpay' }) as unknown,
          expires_at: '2026-10-30T10:15:00.000Z',
        }),
      );
      expect(result).toEqual({
        status: 'pending',
        chargeId: 'chrg_pp1',
        qrImageUrl: 'https://api.omise.co/qr.svg',
        expiresAt: '2026-10-30T10:15:00.000Z',
      });
    });

    it('fails a charge the provider refused or gave no QR code', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_pp2',
        failure_code: 'failed_processing',
        source: { type: 'promptpay' },
      });

      expect(await provider.chargePromptPay(80_000, expiresAt)).toEqual({
        status: 'failed',
        errorCode: 'failed_processing',
        message: 'Mocked message for failed_processing',
      });

      mockChargesCreate.mockResolvedValueOnce({ id: 'chrg_pp3' });
      expect(await provider.chargePromptPay(80_000, expiresAt)).toMatchObject({
        status: 'failed',
        errorCode: 'unspecified',
      });
    });

    it('fails when the provider cannot be reached', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockChargesCreate.mockRejectedValueOnce(new Error('network'));

      expect(await provider.chargePromptPay(80_000, expiresAt)).toMatchObject({
        status: 'failed',
        errorCode: 'unspecified',
      });
      consoleSpy.mockRestore();
    });
  });

  describe('chargeMobileBanking', () => {
    it('makes a charge on the bank’s source and gives the page that opens its app', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_mb1',
        status: 'pending',
        authorize_uri: 'https://pay.omise.co/payments/pay2_test/authorize',
        source: { type: 'mobile_banking_kbank' },
      });

      const result = await provider.chargeMobileBanking(
        80_000,
        'kbank',
        'ANDROID',
        'https://api.backend.app/payment/callback/inv',
      );

      expect(mockChargesCreate).toHaveBeenCalledWith({
        amount: 80_000,
        currency: 'usd',
        source: {
          type: 'mobile_banking_kbank',
          amount: 80_000,
          currency: 'usd',
          platform_type: 'ANDROID',
        },
        return_uri: 'https://api.backend.app/payment/callback/inv',
      });
      expect(result).toEqual({
        status: 'pending',
        chargeId: 'chrg_mb1',
        authorizeUri: 'https://pay.omise.co/payments/pay2_test/authorize',
      });
    });

    it('leaves the platform out when the browser could not tell', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_mb2',
        authorize_uri: 'https://pay.omise.co/x',
      });

      await provider.chargeMobileBanking(80_000, 'scb', undefined, 'url');

      expect(mockChargesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          source: {
            type: 'mobile_banking_scb',
            amount: 80_000,
            currency: 'usd',
          },
        }),
      );
    });

    it('fails a charge the provider refused or gave no page for', async () => {
      mockChargesCreate.mockResolvedValueOnce({
        id: 'chrg_mb3',
        failure_code: 'failed_processing',
      });
      expect(
        await provider.chargeMobileBanking(80_000, 'bbl', undefined, 'url'),
      ).toEqual({
        status: 'failed',
        errorCode: 'failed_processing',
        message: 'Mocked message for failed_processing',
      });

      mockChargesCreate.mockResolvedValueOnce({ id: 'chrg_mb4' });
      expect(
        await provider.chargeMobileBanking(80_000, 'bbl', undefined, 'url'),
      ).toMatchObject({ status: 'failed', errorCode: 'unspecified' });
    });

    it('fails when the provider cannot be reached', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockChargesCreate.mockRejectedValueOnce(new Error('network'));

      expect(
        await provider.chargeMobileBanking(80_000, 'ktb', undefined, 'url'),
      ).toMatchObject({ status: 'failed', errorCode: 'unspecified' });
      consoleSpy.mockRestore();
    });
  });

  describe('getChargeStatus', () => {
    it('names a charge paid in a bank’s app by the app', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        id: 'chrg_mb1',
        status: 'successful',
        authorize_uri: 'https://pay.omise.co/x',
        card: null,
        source: { type: 'mobile_banking_scb' },
      });

      expect(await provider.getChargeStatus('chrg_mb1')).toMatchObject({
        status: 'success',
        brand: 'SCB EASY',
        lastDigits: '',
      });
    });

    it('names nothing for a source it does not know', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        id: 'chrg_x',
        status: 'successful',
        card: null,
        source: { type: 'mobile_banking_unknown' },
      });

      expect(await provider.getChargeStatus('chrg_x')).toMatchObject({
        status: 'success',
        brand: '',
      });
    });

    it('names a paid PromptPay charge, which has no card, by its method', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        id: 'chrg_pp1',
        status: 'successful',
        authorize_uri: null,
        card: null,
        source: { type: 'promptpay' },
      });

      expect(await provider.getChargeStatus('chrg_pp1')).toEqual({
        status: 'success',
        brand: 'PromptPay',
        lastDigits: '',
        redirectUrl: '',
        chargeId: 'chrg_pp1',
      });
    });

    it('fails a PromptPay code that expired unpaid', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        id: 'chrg_pp1',
        status: 'expired',
        card: null,
        source: { type: 'promptpay' },
      });

      expect(await provider.getChargeStatus('chrg_pp1')).toMatchObject({
        status: 'failed',
        brand: 'PromptPay',
        lastDigits: '',
      });
    });

    it('Branch 1: Success', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        id: 'chrg_ret123',
        status: 'successful',
        authorize_uri: 'https://omise.co/redirect',
        card: {
          brand: 'JCB',
          last_digits: '1234',
        },
      });

      const result = await provider.getChargeStatus('chrg_ret123');

      expect(mockChargesRetrieve).toHaveBeenCalledWith('chrg_ret123');
      expect(result).toEqual({
        status: 'success',
        brand: 'JCB',
        lastDigits: '1234',
        redirectUrl: 'https://omise.co/redirect',
        chargeId: 'chrg_ret123',
      });
    });

    it('Branch 2: Failure Code', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        failure_code: 'rejected',
        card: {
          brand: 'Visa',
          last_digits: '4321',
        },
      });

      const result = await provider.getChargeStatus('chrg_ret123');

      expect(result).toEqual({
        status: 'failed',
        brand: 'Visa',
        lastDigits: '4321',
        errorCode: 'rejected',
        message: 'Mocked message for rejected',
      });
    });

    it('is pending while 3-D Secure has not finished', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        id: 'chrg_ret123',
        status: 'pending',
        authorize_uri: 'https://omise.co/redirect',
        card: { brand: 'Visa', last_digits: '4242' },
      });

      expect(await provider.getChargeStatus('chrg_ret123')).toEqual({
        status: 'pending',
      });
    });

    it('fails a charge that ended unpaid without a failure code', async () => {
      mockChargesRetrieve.mockResolvedValueOnce({
        id: 'chrg_ret123',
        status: 'expired',
        card: { brand: 'Visa', last_digits: '4242' },
      });

      expect(await provider.getChargeStatus('chrg_ret123')).toEqual({
        status: 'failed',
        brand: 'Visa',
        lastDigits: '4242',
        errorCode: 'unspecified',
        message: 'Mocked message for unspecified',
      });
    });

    it('Branch 3: Try/Catch Error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const errorInstance = new Error('Not found');
      mockChargesRetrieve.mockRejectedValueOnce(errorInstance);

      const result = await provider.getChargeStatus('chrg_invalid');

      expect(result).toEqual({
        status: 'failed',
        brand: '',
        lastDigits: '',
        errorCode: 'unspecified',
        message: 'Mocked message for unspecified',
      });

      consoleSpy.mockRestore();
    });
  });
});
