import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import * as crypto from 'crypto';
import { inArray } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import { DRIZZLE } from '@/database/database.module';
import { user } from '@/database/schema';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp } from '@/app.factory';
import { signUpActiveUser } from './support/accounts';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { ChargeStatus } from '@/modules/payment/providers/providers';

describe('PaymentController (e2e)', () => {
  let app: NestExpressApplication;
  const createdUserIds: string[] = [];
  let db: DrizzleDB;
  let chargeArgs: [SessionUser, number, string, string] | undefined;
  const paymentProvider: IPaymentProvider = {
    chargeSpecificCard(...args): Promise<ChargeStatus> {
      chargeArgs = args;
      return Promise.resolve({
        status: 'success',
        redirectUrl: 'https://pay.omise.co/charges/chrg_test/authorize',
      });
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IPaymentProvider)
      .useValue(paymentProvider)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();

    db = app.get<DrizzleDB>(DRIZZLE);
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await db.delete(user).where(inArray(user.id, createdUserIds));
    }
    await app.close();
  });

  const signUp = () =>
    signUpActiveUser({ app, db }, 'e2e', createdUserIds, {
      name: 'E2E User',
      fullName: 'E2E Test User',
    });

  it('redirects to 3DS after the payment provider accepts the checkout', async () => {
    const { agent, userId } = await signUp();
    chargeArgs = undefined;

    const checkoutPayload = {
      serviceId: crypto.randomUUID(),
      startTimes: [new Date().toISOString()],
      cardToken: 'tokn_test_checkout',
    };

    const response = await agent
      .post('/api/v1/payment/checkout')
      .send(checkoutPayload);

    expect(response.status).toBe(303);

    const redirectUrl = response.headers['location'];
    expect(redirectUrl).toBeDefined();
    expect(redirectUrl).toMatch(/^https:\/\/(pay|api)\.omise\.co\//);
    expect(chargeArgs?.[0].id).toBe(userId);
    expect(typeof chargeArgs?.[1]).toBe('number');
    expect(chargeArgs?.[2]).toBe('tokn_test_checkout');
    expect(chargeArgs?.[3]).toContain('/payments/verify/');
  });
});
