import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type Omise from 'omise';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { PayoutAccountRepository } from './payout-account.repository';
import { PayoutAccountService } from './payout-account.service';
import type { PayoutAccountRow } from './payouts.types';

const advisor = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'advisor@example.com',
} as SessionUser;

const row: PayoutAccountRow = {
  userId: advisor.id,
  bankAccountId: 'recp_old',
  bankName: 'kbank',
  accountName: 'Araya S',
  isDefault: true,
};

function makeRecipient(
  overrides: Partial<Omise.Recipients.IRecipient> = {},
): Omise.Recipients.IRecipient {
  return {
    object: 'recipient',
    id: 'recp_new',
    created_at: '2026-11-02T08:00:00Z',
    verified: false,
    active: false,
    bank_account: {
      name: 'Araya S',
      brand: 'Kasikornbank',
      last_digits: '7890',
    },
    ...overrides,
  } as Omise.Recipients.IRecipient;
}

describe('PayoutAccountService', () => {
  let service: PayoutAccountService;
  let repository: jest.Mocked<
    Pick<PayoutAccountRepository, 'findForUser' | 'upsert' | 'remove'>
  >;
  let recipients: jest.Mocked<
    Pick<Omise.Recipients.IRecipientsAPI, 'create' | 'retrieve' | 'destroy'>
  >;

  beforeEach(() => {
    repository = {
      findForUser: jest.fn(),
      upsert: jest.fn(),
      remove: jest.fn(),
    };
    recipients = {
      create: jest.fn(),
      retrieve: jest.fn(),
      destroy: jest.fn(),
    };
    service = new PayoutAccountService(
      repository as unknown as PayoutAccountRepository,
      recipients as unknown as Omise.Recipients.IRecipientsAPI,
    );
  });

  describe('findMine', () => {
    it('is 404 while the Advisor has no account', async () => {
      repository.findForUser.mockResolvedValue(undefined);
      await expect(service.findMine(advisor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('reads the last digits and the checks from the recipient', async () => {
      repository.findForUser.mockResolvedValue(row);
      recipients.retrieve.mockResolvedValue(
        makeRecipient({ id: 'recp_old', verified: true, active: true }),
      );

      await expect(service.findMine(advisor)).resolves.toMatchObject({
        bank: 'kbank',
        accountName: 'Araya S',
        lastDigits: '7890',
        verified: true,
        active: true,
      });
      expect(recipients.retrieve).toHaveBeenCalledWith('recp_old');
    });

    it('still answers from the row when Omise cannot be reached', async () => {
      repository.findForUser.mockResolvedValue(row);
      recipients.retrieve.mockRejectedValue(new Error('timeout'));

      await expect(service.findMine(advisor)).resolves.toMatchObject({
        bank: 'kbank',
        lastDigits: null,
        verified: false,
      });
    });
  });

  describe('save', () => {
    const dto = {
      bank: 'kbank' as const,
      accountNumber: '1234567890',
      accountName: 'Araya S',
    };

    it('creates the recipient with the Thai brand, stores it, and destroys the old one', async () => {
      repository.findForUser.mockResolvedValue(row);
      recipients.create.mockResolvedValue(makeRecipient());

      await expect(service.save(advisor, dto)).resolves.toMatchObject({
        bank: 'kbank',
        lastDigits: '7890',
        verified: false,
      });
      expect(recipients.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Araya S',
          type: 'individual',
          bank_account: {
            brand: 'kbank',
            number: '1234567890',
            name: 'Araya S',
          },
        }),
      );
      expect(repository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: advisor.id,
          bankAccountId: 'recp_new',
          bankName: 'kbank',
        }),
      );
      expect(recipients.destroy).toHaveBeenCalledWith('recp_old');
    });

    it('is 400 when Omise refuses the account, and stores nothing', async () => {
      repository.findForUser.mockResolvedValue(undefined);
      recipients.create.mockRejectedValue({ code: 'invalid_bank_account' });

      await expect(service.save(advisor, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.upsert).not.toHaveBeenCalled();
    });

    it('is 502 when Omise cannot be reached', async () => {
      repository.findForUser.mockResolvedValue(undefined);
      recipients.create.mockRejectedValue(new Error('ECONNRESET'));

      await expect(service.save(advisor, dto)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('destroys the new recipient when the row cannot be written', async () => {
      repository.findForUser.mockResolvedValue(undefined);
      recipients.create.mockResolvedValue(makeRecipient());
      repository.upsert.mockRejectedValue(new Error('db down'));

      await expect(service.save(advisor, dto)).rejects.toThrow('db down');
      expect(recipients.destroy).toHaveBeenCalledWith('recp_new');
    });
  });

  describe('remove', () => {
    it('deletes the row and destroys the recipient', async () => {
      repository.findForUser.mockResolvedValue(row);

      await service.remove(advisor);
      expect(repository.remove).toHaveBeenCalledWith(advisor.id);
      expect(recipients.destroy).toHaveBeenCalledWith('recp_old');
    });

    it('still removes the row when Omise cannot destroy the recipient', async () => {
      repository.findForUser.mockResolvedValue(row);
      recipients.destroy.mockRejectedValue(new Error('timeout'));

      await expect(service.remove(advisor)).resolves.toBeUndefined();
      expect(repository.remove).toHaveBeenCalledWith(advisor.id);
    });

    it('is 404 while the Advisor has no account', async () => {
      repository.findForUser.mockResolvedValue(undefined);
      await expect(service.remove(advisor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
