import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import type { Env } from '@/config/env.schema';
import type { PushRepository, PushSubscriptionRow } from './push.repository';
import { PushService } from './push.service';

jest.mock('web-push', () => ({
  __esModule: true,
  default: { setVapidDetails: jest.fn(), sendNotification: jest.fn() },
}));

const userId = '11111111-1111-1111-1111-111111111111';
const payload = {
  title: 'จองสำเร็จ',
  body: 'พรุ่งนี้ 10:00',
  url: '/bookings',
};

const makeRow = (
  endpoint: string,
  overrides: Partial<PushSubscriptionRow> = {},
): PushSubscriptionRow => ({
  id: '22222222-2222-2222-2222-222222222222',
  userId,
  endpoint,
  p256dh: 'p256dh-key',
  auth: 'auth-secret',
  userAgent: null,
  createdAt: new Date('2026-10-24T00:00:00Z'),
  ...overrides,
});

const sendNotification = webpush.sendNotification as jest.Mock;
const setVapidDetails = webpush.setVapidDetails as jest.Mock;

const configWith = (values: Record<string, string | undefined>) =>
  ({
    get: (key: string) => values[key],
  }) as unknown as ConfigService<Env, true>;

const vapid = {
  VAPID_PUBLIC_KEY: 'public-key',
  VAPID_PRIVATE_KEY: 'private-key',
  VAPID_SUBJECT: 'mailto:ops@example.com',
};

describe('PushService', () => {
  let repository: jest.Mocked<
    Pick<
      PushRepository,
      'upsert' | 'findByUser' | 'deleteForUser' | 'deleteByEndpoint'
    >
  >;
  let service: PushService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      upsert: jest.fn(),
      findByUser: jest.fn(),
      deleteForUser: jest.fn(),
      deleteByEndpoint: jest.fn().mockResolvedValue(undefined),
    };
    service = new PushService(
      configWith(vapid),
      repository as unknown as PushRepository,
    );
  });

  describe('configuration', () => {
    it('hands the VAPID details to web-push and exposes the public key', () => {
      expect(setVapidDetails).toHaveBeenCalledWith(
        'mailto:ops@example.com',
        'public-key',
        'private-key',
      );
      expect(service.getPublicKey().publicKey).toBe('public-key');
    });

    it('is switched off without keys: no public key and nothing is sent', async () => {
      jest.clearAllMocks();
      const off = new PushService(
        configWith({}),
        repository as unknown as PushRepository,
      );

      await off.sendToUser(userId, payload);

      expect(setVapidDetails).not.toHaveBeenCalled();
      expect(off.getPublicKey().publicKey).toBeNull();
      expect(repository.findByUser).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('stores the subscription for the user and returns it without keys', async () => {
      repository.upsert.mockResolvedValue(makeRow('https://push.example/a'));

      const result = await service.subscribe(
        userId,
        {
          endpoint: 'https://push.example/a',
          keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
        },
        'Chrome',
      );

      expect(repository.upsert).toHaveBeenCalledWith({
        userId,
        endpoint: 'https://push.example/a',
        p256dh: 'p256dh-key',
        auth: 'auth-secret',
        userAgent: 'Chrome',
      });
      expect(result).toEqual({
        id: '22222222-2222-2222-2222-222222222222',
        endpoint: 'https://push.example/a',
        createdAt: new Date('2026-10-24T00:00:00Z'),
      });
    });
  });

  describe('unsubscribe', () => {
    it('removes the user’s own subscription', async () => {
      repository.deleteForUser.mockResolvedValue(
        makeRow('https://push.example/a'),
      );

      const result = await service.unsubscribe(
        userId,
        'https://push.example/a',
      );

      expect(repository.deleteForUser).toHaveBeenCalledWith(
        userId,
        'https://push.example/a',
      );
      expect(result.endpoint).toBe('https://push.example/a');
    });

    it('answers not found for an endpoint that is not theirs', async () => {
      repository.deleteForUser.mockResolvedValue(undefined);

      await expect(
        service.unsubscribe(userId, 'https://push.example/other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('sendToUser', () => {
    it('sends the payload to every subscription of the user', async () => {
      repository.findByUser.mockResolvedValue([
        makeRow('https://push.example/a'),
        makeRow('https://push.example/b', { p256dh: 'k2', auth: 'a2' }),
      ]);
      sendNotification.mockResolvedValue({ statusCode: 201 });

      await service.sendToUser(userId, payload);

      expect(sendNotification).toHaveBeenCalledTimes(2);
      expect(sendNotification).toHaveBeenCalledWith(
        {
          endpoint: 'https://push.example/b',
          keys: { p256dh: 'k2', auth: 'a2' },
        },
        JSON.stringify(payload),
        { TTL: 86400 },
      );
    });

    it.each([404, 410])(
      'deletes a subscription the push service answers %i for, and still sends to the rest',
      async (statusCode) => {
        repository.findByUser.mockResolvedValue([
          makeRow('https://push.example/gone'),
          makeRow('https://push.example/ok'),
        ]);
        sendNotification.mockImplementation(
          (subscription: { endpoint: string }) =>
            subscription.endpoint.endsWith('gone')
              ? Promise.reject(Object.assign(new Error('gone'), { statusCode }))
              : Promise.resolve({ statusCode: 201 }),
        );

        await service.sendToUser(userId, payload);

        expect(repository.deleteByEndpoint).toHaveBeenCalledTimes(1);
        expect(repository.deleteByEndpoint).toHaveBeenCalledWith(
          'https://push.example/gone',
        );
        expect(sendNotification).toHaveBeenCalledTimes(2);
      },
    );

    it('keeps the subscription on other failures and does not throw', async () => {
      repository.findByUser.mockResolvedValue([
        makeRow('https://push.example/a'),
      ]);
      sendNotification.mockRejectedValue(
        Object.assign(new Error('boom'), { statusCode: 500 }),
      );

      await expect(
        service.sendToUser(userId, payload),
      ).resolves.toBeUndefined();

      expect(repository.deleteByEndpoint).not.toHaveBeenCalled();
    });

    it('does not throw when the lookup itself fails', async () => {
      repository.findByUser.mockRejectedValue(new Error('db down'));

      await expect(
        service.sendToUser(userId, payload),
      ).resolves.toBeUndefined();
    });
  });
});
