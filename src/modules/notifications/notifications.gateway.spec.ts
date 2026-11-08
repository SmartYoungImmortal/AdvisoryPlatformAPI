import type { NotificationServer } from './notifications-socket.types';
import type { Auth } from '@/modules/auth/auth.config';
import type { NotificationsRealtime } from './notifications-realtime';

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(() => new Headers()),
}));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthService: class AuthService {},
}));

import { NotificationsGateway } from './notifications.gateway';

const userId = '11111111-1111-1111-1111-111111111111';

function makeClient() {
  return {
    handshake: { headers: { cookie: 'session=x' } },
    data: {} as { userId?: string },
    join: jest.fn().mockResolvedValue(undefined),
  };
}

describe('NotificationsGateway', () => {
  let getSession: jest.Mock;
  let realtime: jest.Mocked<Pick<NotificationsRealtime, 'attach'>>;
  let gateway: NotificationsGateway;

  beforeEach(() => {
    getSession = jest.fn();
    realtime = { attach: jest.fn() };
    gateway = new NotificationsGateway(
      { api: { getSession } } as unknown as Auth,
      realtime as unknown as NotificationsRealtime,
    );
  });

  it('hands its server to the realtime notifier and signs every connection in', () => {
    const use = jest.fn();
    const server = { use } as unknown as NotificationServer;

    gateway.afterInit(server);

    expect(realtime.attach).toHaveBeenCalledWith(server);
    expect(use).toHaveBeenCalledTimes(1);
  });

  it('lets an active account in and puts it in its own room', async () => {
    getSession.mockResolvedValue({ user: { id: userId, status: 'ACTIVE' } });
    const client = makeClient();
    const next = jest.fn();

    await gateway.signIn(client as never, next);
    gateway.handleConnection(client as never);

    expect(next).toHaveBeenCalledWith();
    expect(client.data.userId).toBe(userId);
    expect(client.join).toHaveBeenCalledWith(`user:${userId}`);
  });

  it.each([
    ['no session', null],
    ['an inactive account', { user: { id: userId, status: 'SUSPENDED' } }],
  ])('refuses %s', async (_case, session) => {
    getSession.mockResolvedValue(session);
    const client = makeClient();
    const next = jest.fn();

    await gateway.signIn(client as never, next);
    gateway.handleConnection(client as never);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(client.join).not.toHaveBeenCalled();
  });

  it('refuses the connection when the session check fails', async () => {
    getSession.mockRejectedValue(new Error('database down'));
    const next = jest.fn();

    await gateway.signIn(makeClient() as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
