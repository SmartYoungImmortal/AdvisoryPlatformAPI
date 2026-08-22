import { ENV_KEYS } from '@/config/env.constants';
import { SessionUser } from '@/modules/auth/auth.config';
import { OmiseRepository } from '@/modules/payment/providers/omise/omise.repository';
import {
  ChargeStatus,
  FailureCodeEnum,
  FailureCodeKeys,
  IPaymentProvider,
} from '@/modules/payment/providers/providers';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Omise from 'omise';

function createOmiseCustomer(user: SessionUser): Omise.Customers.IRequest {
  return {
    email: user.email,
    description: `Name: ${user.name}; Full Name: ${user.fullName};`,
    metadata: {
      userId: user.id,
    },
  };
}

@Injectable()
export class OmisePaymentProvider implements IPaymentProvider {
  constructor(
    private config: ConfigService,
    private readonly repo: OmiseRepository,
  ) {}

  omise = (() =>
    Omise({
      omiseVersion: '2019-05-29',
      secretKey: this.config.get(ENV_KEYS.OMISE_SECRET_KEY),
      publicKey: this.config.get(ENV_KEYS.OMISE_PUBLIC_KEY),
    }))();

  async createCustomerAndBindCard(
    user: SessionUser,
    cardToken: string,
  ): Promise<void> {
    const customerReqData: Omise.Customers.IRequest = {
      ...createOmiseCustomer(user),
      card: cardToken,
    };

    const omiseCustomerRes = await this.omise.customers.create(customerReqData);

    await this.repo.recordOmiseCustomer(user.id, omiseCustomerRes.id);
    return;
  }

  async chargeDefaultCard(
    user: SessionUser,
    amount: number,
  ): Promise<ChargeStatus> {
    const omiseCustomer = await this.repo.getOmiseCustomer(user.id);

    if (!omiseCustomer)
      throw new BadRequestException('Omise customer not found');

    try {
      const chargeRes = await this.omise.charges.create({
        amount,
        currency: this.config.get(ENV_KEYS.CURRENCY_CODE) || 'thb',
        customer: omiseCustomer.customerId,
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
      };
    } catch (error) {
      console.error(error);
      return {
        status: 'failed',
        errorCode: 'unspecified',
        message: FailureCodeEnum.parse('unspecified'),
      };
    }
  }

  async chargeSpecificCard(
    user: SessionUser,
    amount: number,
    cardId: string,
  ): Promise<ChargeStatus> {
    const omiseCustomer = await this.repo.getOmiseCustomer(user.id);

    if (!omiseCustomer)
      throw new BadRequestException('Omise customer not found');
    try {
      const chargeRes = await this.omise.charges.create({
        amount,
        currency: this.config.get(ENV_KEYS.CURRENCY_CODE) || 'thb',
        customer: omiseCustomer.customerId,
        card: cardId,
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
      };
    } catch (error) {
      console.error(error);
      return {
        status: 'failed',
        errorCode: 'unspecified',
        message: FailureCodeEnum.parse('unspecified'),
      };
    }
  }
}
