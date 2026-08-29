import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Auth, AuthSession } from '@/modules/auth/auth.config';
import type { ChatSocket } from './chat-socket-session.service';

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(() => new Headers()),
}));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthService: class AuthService {},
}));

import { ChatSocketSessionService } from './chat-socket-session.service';

function session(status: string): AuthSession {
  return {
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'chat@example.test',
      emailVerified: false,
      name: 'Chat User',
      image: null,
      fullName: 'Chat User',
      avatarKey: null,
      timezone: 'Asia/Bangkok',
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: '22222222-2222-4222-8222-222222222222',
      userId: '11111111-1111-4111-8111-111111111111',
      token: 'token',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  };
}

describe('ChatSocketSessionService', () => {
  let getSession: jest.Mock;
  let service: ChatSocketSessionService;
  let client: Pick<ChatSocket, 'handshake' | 'data'>;

  beforeEach(() => {
    getSession = jest.fn();
    const auth = { api: { getSession } };
    service = new ChatSocketSessionService(auth as unknown as Auth);
    client = {
      handshake: { headers: { cookie: 'better-auth.session_token=test' } },
      data: {},
    } as Pick<ChatSocket, 'handshake' | 'data'>;
  });

  it('attaches the active Better Auth session to socket data', async () => {
    const activeSession = session('ACTIVE');
    getSession.mockResolvedValue(activeSession);

    await service.authenticate(client as ChatSocket);

    expect(client.data.user?.id).toBe(activeSession.user.id);
    expect(client.data.session?.id).toBe(activeSession.session.id);
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('rejects missing and inactive sessions', async () => {
    getSession.mockResolvedValueOnce(null);
    await expect(service.authenticate(client as ChatSocket)).rejects.toThrow(
      UnauthorizedException,
    );

    getSession.mockResolvedValueOnce(session('SUSPENDED'));
    await expect(service.authenticate(client as ChatSocket)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
