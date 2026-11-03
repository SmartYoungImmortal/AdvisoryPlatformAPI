import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type Omise from 'omise';
import type { SessionUser } from '@/modules/auth/auth.config';
import { PayoutAccountResponseDto } from './dtos/payout-account-response.dto';
import type { SavePayoutAccountDto } from './dtos/save-payout-account.dto';
import { PayoutAccountRepository } from './payout-account.repository';
import {
  PAYOUT_ACCOUNT_MESSAGES,
  PAYOUT_BANKS,
  type PayoutBank,
} from './payouts.constants';
import type { PayoutAccount, PayoutAccountRow } from './payouts.types';

/** The Omise Recipients API the service is given (`payouts.module.ts` builds it from the keys). */
export const OMISE_RECIPIENTS = Symbol('OMISE_RECIPIENTS');

/**
 * What Omise's Thai recipients take as `bank_account`. The library's types carry the Japanese
 * fields (`bank_code`, `branch_code`); a Thai account is named by its `brand` instead.
 */
interface ThaiBankAccountRequest {
  brand: PayoutBank;
  number: string;
  name: string;
}

/** Omise's refusal of the account itself, as opposed to a failure to reach it. */
function isAccountRefusal(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'invalid_bank_account' || code === 'invalid_recipient';
}

function asBank(value: string | null): PayoutBank | null {
  return PAYOUT_BANKS.find((bank) => bank === value) ?? null;
}

/**
 * The Advisor's payout account, kept as an Omise recipient: saving creates the recipient and points
 * the Advisor's `omise_bank_accounts` row at it, replacing the one before; removing destroys it.
 *
 * Only the recipient's id, the bank and the name are stored here; the number is sent once, to
 * Omise, and read back only as its last digits.
 */
@Injectable()
export class PayoutAccountService {
  private readonly logger = new Logger(PayoutAccountService.name);

  constructor(
    private readonly repository: PayoutAccountRepository,
    @Inject(OMISE_RECIPIENTS)
    private readonly recipients: Omise.Recipients.IRecipientsAPI,
  ) {}

  async findMine(user: SessionUser): Promise<PayoutAccountResponseDto> {
    const row = await this.repository.findForUser(user.id);
    const bank = asBank(row?.bankName ?? null);
    if (!row || !bank) {
      throw new NotFoundException(PAYOUT_ACCOUNT_MESSAGES.notFound);
    }

    let recipient: Omise.Recipients.IRecipient | null = null;
    try {
      recipient = await this.recipients.retrieve(row.bankAccountId);
    } catch (error: unknown) {
      // The row still says which bank and whose name; only what Omise holds is missing.
      this.logger.warn(
        `Recipient ${row.bankAccountId} could not be read: ${String(error)}`,
      );
    }
    return new PayoutAccountResponseDto(this.toAccount(row, bank, recipient));
  }

  async save(
    user: SessionUser,
    dto: SavePayoutAccountDto,
  ): Promise<PayoutAccountResponseDto> {
    const previous = await this.repository.findForUser(user.id);
    const bankAccount: ThaiBankAccountRequest = {
      brand: dto.bank,
      number: dto.accountNumber,
      name: dto.accountName,
    };

    let recipient: Omise.Recipients.IRecipient;
    try {
      recipient = await this.recipients.create({
        name: dto.accountName,
        email: user.email,
        type: 'individual',
        description: `Advisor ${user.id}`,
        metadata: { userId: user.id },
        bank_account:
          bankAccount as unknown as Omise.Recipients.IRequest['bank_account'],
      });
    } catch (error: unknown) {
      if (isAccountRefusal(error)) {
        throw new BadRequestException(PAYOUT_ACCOUNT_MESSAGES.rejected);
      }
      this.logger.error(`Recipient could not be created: ${String(error)}`);
      throw new BadGatewayException(PAYOUT_ACCOUNT_MESSAGES.unavailable);
    }

    const row: PayoutAccountRow = {
      userId: user.id,
      bankAccountId: recipient.id,
      bankName: dto.bank,
      accountName: dto.accountName,
      isDefault: true,
    };
    try {
      await this.repository.upsert(row);
    } catch (error: unknown) {
      // Nothing points at the new recipient, so it goes rather than lingering unused.
      await this.destroy(recipient.id);
      throw error;
    }

    if (previous && previous.bankAccountId !== recipient.id) {
      await this.destroy(previous.bankAccountId);
    }
    return new PayoutAccountResponseDto(
      this.toAccount(row, dto.bank, recipient),
    );
  }

  async remove(user: SessionUser): Promise<void> {
    const row = await this.repository.findForUser(user.id);
    if (!row) throw new NotFoundException(PAYOUT_ACCOUNT_MESSAGES.notFound);
    await this.repository.remove(user.id);
    await this.destroy(row.bankAccountId);
  }

  /** Best effort: a recipient Omise no longer has, or cannot reach, is logged and left. */
  private async destroy(recipientId: string): Promise<void> {
    try {
      await this.recipients.destroy(recipientId);
    } catch (error: unknown) {
      this.logger.warn(
        `Recipient ${recipientId} could not be destroyed: ${String(error)}`,
      );
    }
  }

  private toAccount(
    row: PayoutAccountRow,
    bank: PayoutBank,
    recipient: Omise.Recipients.IRecipient | null,
  ): PayoutAccount {
    return {
      bank,
      accountName: row.accountName ?? recipient?.bank_account.name ?? '',
      lastDigits: recipient?.bank_account.last_digits ?? null,
      verified: recipient?.verified ?? false,
      active: recipient?.active ?? false,
      createdAt: recipient ? new Date(recipient.created_at) : null,
    };
  }
}
