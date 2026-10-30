import { ENV_KEYS } from '@/config/env.constants';
import { SessionUser } from '@/modules/auth/auth.config';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import type {
  CardId,
  CustomerId,
  TokenId,
} from '@/modules/payment/providers/omise/types';
import { TokenIdPrefix } from '@/modules/payment/providers/omise/types';
import { OmiseRepository } from '@/modules/payment/providers/omise/omise.repository';
import {
  ChargeStatus,
  FailureCodeEnum,
  FailureCodeKeys,
  PROMPTPAY_BRAND,
  type PromptPayCharge,
} from '@/modules/payment/providers/providers';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Omise from 'omise';
import {
  createOmiseCustomer,
  getCardIds,
  sortCardsDescendingAddDate,
} from '@/modules/payment/providers/omise/utils';

@Injectable()
export class OmisePaymentProvider implements IPaymentProvider {
  public readonly omise: Omise.IOmise;

  constructor(
    private readonly config: ConfigService,
    private readonly repo: OmiseRepository,
  ) {
    this.omise = Omise({
      omiseVersion: '2019-05-29',
      secretKey: this.config.get(ENV_KEYS.OMISE_SECRET_KEY),
      publicKey: this.config.get(ENV_KEYS.OMISE_PUBLIC_KEY),
    });
  }

  async saveTokenToOmiseCustomer(
    user: SessionUser,
    customerId: CustomerId,
    tokenId: TokenId,
  ) {
    const customer = await this.omise.customers.update(customerId, {
      card: tokenId,
    });
    await this.repo.recordOmiseCards(user.id, getCardIds(customer.cards.data));
    return customer;
  }

  async getOmiseCustomerIdandSaveToken(
    user: SessionUser,
    cardOrTokenId: CardId | TokenId,
  ): Promise<{
    customerId: CustomerId;
    cardId: CardId;
  }> {
    const isToken = cardOrTokenId.startsWith(TokenIdPrefix);
    const localOmiseCustomer = await this.repo.getOmiseCustomer(user.id);
    if (localOmiseCustomer !== undefined) {
      const customerId = localOmiseCustomer.customerId as CustomerId;
      const cardId: CardId = isToken
        ? (sortCardsDescendingAddDate(
            (
              await this.saveTokenToOmiseCustomer(
                user,
                customerId,
                cardOrTokenId as TokenId,
              )
            ).cards.data,
          )[0].id as CardId)
        : (cardOrTokenId as CardId);
      return {
        customerId,
        cardId,
      };
    }

    if (!isToken) throw new BadRequestException('Card token expected');

    const customerReqData: Omise.Customers.IRequest = {
      ...createOmiseCustomer(user),
      card: cardOrTokenId,
    };

    const customer = await this.omise.customers.create(customerReqData);
    const recordCustomerPromise = this.repo.recordOmiseCustomer(
      user.id,
      customer.id as CustomerId,
    );
    const recordCardsPromise = this.repo.recordOmiseCards(
      user.id,
      getCardIds(customer.cards.data),
    );

    const customerId = customer.id as CustomerId;
    const cardId = sortCardsDescendingAddDate(customer.cards.data)[0]
      .id as CardId;

    await Promise.all([recordCustomerPromise, recordCardsPromise]);
    return {
      customerId,
      cardId,
    };
  }

  /**
   * Whether a token holds a wallet's card (Google Pay, Apple Pay): Omise sets the card's
   * `tokenization_method` on those, and refuses them on the Customers API.
   */
  async isWalletToken(tokenId: TokenId): Promise<boolean> {
    const token = await this.omise.tokens.retrieve(tokenId);
    // Not in the library's types; Omise answers it on every token, null for a typed card.
    const card = token.card as typeof token.card & {
      tokenization_method?: string | null;
    };
    return Boolean(card.tokenization_method);
  }

  /**
   * What the charge is made on: a wallet's token as itself, since it cannot be saved to a
   * customer; anything else as the card saved on the user's Omise customer.
   */
  private async chargeTarget(
    user: SessionUser,
    cardOrTokenId: CardId | TokenId,
  ): Promise<{ customer?: CustomerId; card: CardId | TokenId }> {
    if (
      cardOrTokenId.startsWith(TokenIdPrefix) &&
      (await this.isWalletToken(cardOrTokenId as TokenId))
    ) {
      return { card: cardOrTokenId };
    }
    const { customerId, cardId } = await this.getOmiseCustomerIdandSaveToken(
      user,
      cardOrTokenId,
    );
    return { customer: customerId, card: cardId };
  }

  async chargeSpecificCard(
    user: SessionUser,
    amount: number,
    cardOrTokenId: CardId | TokenId,
    redirectUri: string,
  ): Promise<ChargeStatus> {
    const target = await this.chargeTarget(user, cardOrTokenId);

    try {
      const chargeRes = await this.omise.charges.create({
        amount,
        currency: this.config.get(ENV_KEYS.CURRENCY_CODE) || 'thb',
        ...target,
        return_uri: redirectUri,
      });
      if (chargeRes.failure_code) {
        return {
          status: 'failed',
          brand: chargeRes.card.brand,
          lastDigits: chargeRes.card.last_digits,
          errorCode: FailureCodeKeys.parse(chargeRes.failure_code),
          message: FailureCodeEnum.parse(chargeRes.failure_code),
        };
      }
      return {
        status: 'success',
        brand: chargeRes.card.brand,
        lastDigits: chargeRes.card.last_digits,
        redirectUrl: chargeRes.authorize_uri,
        chargeId: chargeRes.id,
      };
    } catch (error: unknown) {
      console.error(error);
      return {
        status: 'failed',
        brand: '',
        lastDigits: '',
        errorCode: 'unspecified',
        message: FailureCodeEnum.parse('unspecified'),
      };
    }
  }

  async chargePromptPay(
    amount: number,
    expiresAt: Date,
  ): Promise<PromptPayCharge> {
    const currency = this.config.get<string>(ENV_KEYS.CURRENCY_CODE) || 'thb';
    try {
      const chargeRes = await this.omise.charges.create({
        amount,
        currency,
        source: { type: 'promptpay', amount, currency },
        expires_at: expiresAt.toISOString(),
      });
      const qrImageUrl = chargeRes.source?.scannable_code?.image?.download_uri;
      if (chargeRes.failure_code || !qrImageUrl) {
        const code = chargeRes.failure_code ?? 'unspecified';
        return {
          status: 'failed',
          errorCode: FailureCodeKeys.parse(code),
          message: FailureCodeEnum.parse(code),
        };
      }
      return {
        status: 'pending',
        chargeId: chargeRes.id,
        qrImageUrl,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error: unknown) {
      console.error(error);
      return {
        status: 'failed',
        errorCode: 'unspecified',
        message: FailureCodeEnum.parse('unspecified'),
      };
    }
  }

  async getChargeStatus(chargeId: string): Promise<ChargeStatus> {
    try {
      const chargeRes = await this.omise.charges.retrieve(chargeId);
      // A charge paid by PromptPay has no card; its receipt names the method instead.
      const card = chargeRes.card as typeof chargeRes.card | null;
      const brand =
        card?.brand ??
        (chargeRes.source?.type === 'promptpay' ? PROMPTPAY_BRAND : '');
      const lastDigits = card?.last_digits ?? '';
      // Still waiting on 3-D Secure, or on a QR code to be scanned: no outcome yet, which is not
      // a success.
      if (chargeRes.status === 'pending' && !chargeRes.failure_code)
        return { status: 'pending' };
      // Declined, or ended without being paid (expired, reversed).
      if (chargeRes.failure_code || chargeRes.status !== 'successful') {
        const code = chargeRes.failure_code ?? 'unspecified';
        return {
          status: 'failed',
          brand,
          lastDigits,
          errorCode: FailureCodeKeys.parse(code),
          message: FailureCodeEnum.parse(code),
        };
      }
      return {
        status: 'success',
        brand,
        lastDigits,
        redirectUrl: chargeRes.authorize_uri ?? '',
        chargeId: chargeRes.id,
      };
    } catch (error: unknown) {
      console.error(error);
      return {
        status: 'failed',
        brand: '',
        lastDigits: '',
        errorCode: 'unspecified',
        message: FailureCodeEnum.parse('unspecified'),
      };
    }
  }
}
