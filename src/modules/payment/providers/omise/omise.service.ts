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
    private config: ConfigService,
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

  async chargeSpecificCard(
    user: SessionUser,
    amount: number,
    cardOrTokenId: CardId | TokenId,
    redirectUri: string,
  ): Promise<ChargeStatus> {
    const { customerId, cardId } = await this.getOmiseCustomerIdandSaveToken(
      user,
      cardOrTokenId,
    );

    try {
      const chargeRes = await this.omise.charges.create({
        amount,
        currency: this.config.get(ENV_KEYS.CURRENCY_CODE) || 'thb',
        customer: customerId,
        card: cardId,
        return_uri: redirectUri,
      });
      if (chargeRes.failure_code) {
        return {
          status: 'failed',
          errorCode: FailureCodeKeys.parse(chargeRes.failure_code),
          message: FailureCodeEnum.parse(chargeRes.failure_code),
        };
      }
      return {
        status: 'success',
        redirectUrl: chargeRes.authorize_uri,
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
}
