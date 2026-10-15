import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import * as crypto from 'crypto';
import { inArray } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import { DRIZZLE } from '@/database/database.module';
import { user } from '@/database/schema';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp } from '@/app.factory';
import type Omise from 'omise';
import { signUpActiveUser } from './support/accounts';

describe('PaymentController (e2e)', () => {
  let app: NestExpressApplication;
  let configService: ConfigService;
  const createdUserIds: string[] = [];
  let omisePublicKey: string;
  let db: DrizzleDB;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();

    configService = app.get(ConfigService);
    db = app.get<DrizzleDB>(DRIZZLE);
    omisePublicKey = configService.get<string>(ENV_KEYS.OMISE_PUBLIC_KEY) || '';

    if (!omisePublicKey) {
      throw new Error('OMISE_PUBLIC_KEY is not defined in the environment.');
    }
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

  async function getOmiseToken(publicKey: string): Promise<string> {
    const url = 'https://vault.omise.co/tokens';

    const authHeader = `Basic ${Buffer.from(publicKey + ':').toString('base64')}`;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        card: {
          expiration_month: 2,
          expiration_year: 2029,
          name: 'Somchai Prasert',
          number: '4242424242424242',
          security_code: '123',
          street1: '476 Fifth Avenue',
          city: 'New York',
          state: 'NY',
          postal_code: '10320',
          country: 'US',
        },
      }),
    };

    const response = await fetch(url, options);
    const data = (await response.json()) as Omise.Tokens.IToken;

    if (data.object !== 'token') {
      throw new Error(
        `Failed to generate Omise token: ${JSON.stringify(data)}`,
      );
    }

    return data.id;
  }

  it('should complete checkout flow and redirect to 3DS validation URL', async () => {
    const { agent } = await signUp();

    const cardToken = await getOmiseToken(omisePublicKey);
    expect(cardToken).toMatch(/^tokn_test_/);

    const checkoutPayload = {
      serviceId: crypto.randomUUID(),
      startTimes: [new Date().toISOString()],
      cardToken: cardToken,
    };

    const response = await agent
      .post('/api/v1/payment/checkout')
      .send(checkoutPayload);

    expect(response.status).toBe(303);

    const redirectUrl = response.headers['location'];
    expect(redirectUrl).toBeDefined();
    expect(redirectUrl).toMatch(/^https:\/\/(pay|api)\.omise\.co\//);
  });
});
