import { HttpException, NotFoundException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { ChatSocket } from './chat-socket-session.service';
import type { ChatSocketSessionService } from './chat-socket-session.service';
import { ChatGateway } from './chat.gateway';
import type { ChatService } from './chat.service';

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(() => new Headers()),
}));

const roomId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const messageId = '33333333-3333-4333-8333-333333333333';

function user(): SessionUser {
  return { id: userId, status: 'ACTIVE' } as SessionUser;
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let service: jest.Mocked<
    Pick<ChatService, 'assertMember' | 'sendMessage' | 'markRead'>
  >;
  let socketSession: jest.Mocked<
    Pick<ChatSocketSessionService, 'authenticate'>
  >;
  let client: ChatSocket;
  let emit: jest.Mock;

  beforeEach(() => {
    service = {
      assertMember: jest.fn(),
      sendMessage: jest.fn(),
      markRead: jest.fn(),
    };
    socketSession = { authenticate: jest.fn().mockResolvedValue(user()) };
    gateway = new ChatGateway(
      service as unknown as ChatService,
      socketSession as unknown as ChatSocketSessionService,
    );
    client = {
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
    } as unknown as ChatSocket;
    emit = jest.fn();
    Object.assign(gateway, {
      server: { to: jest.fn(() => ({ emit })) },
    });
  });

  it('joins and leaves only after current-session membership checks', async () => {
    await expect(gateway.join(client, { chatRoomId: roomId })).resolves.toEqual(
      {
        chatRoomId: roomId,
      },
    );
    await expect(
      gateway.leave(client, { chatRoomId: roomId }),
    ).resolves.toEqual({ chatRoomId: roomId });

    expect(service.assertMember).toHaveBeenCalledTimes(2);
    expect(client.join).toHaveBeenCalledWith(`chat:${roomId}`);
    expect(client.leave).toHaveBeenCalledWith(`chat:${roomId}`);
  });

  it('broadcasts successful message and read operations', async () => {
    const message = {
      id: messageId,
      chatRoomId: roomId,
      senderUserId: userId,
      message: 'hello',
      createdAt: new Date(),
    };
    const read = {
      chatRoomId: roomId,
      memberUserId: userId,
      messageId,
      lastReadAt: message.createdAt,
    };
    service.sendMessage.mockResolvedValue(message);
    service.markRead.mockResolvedValue(read);

    await expect(
      gateway.send(client, { chatRoomId: roomId, message: 'hello' }),
    ).resolves.toBe(message);
    await expect(
      gateway.markRead(client, { chatRoomId: roomId, messageId }),
    ).resolves.toBe(read);

    expect(emit).toHaveBeenCalledWith('chat:message', message);
    expect(emit).toHaveBeenCalledWith('chat:read', read);
  });

  it.each([
    [new NotFoundException('missing'), { statusCode: 404, message: 'missing' }],
    [
      new HttpException('plain response', 418),
      { statusCode: 418, message: 'plain response' },
    ],
    [
      new HttpException({}, 418),
      { statusCode: 418, message: 'Http Exception' },
    ],
    [
      new Error('private failure'),
      { statusCode: 500, message: 'Unable to process chat event' },
    ],
  ])(
    'converts service errors into safe socket errors',
    async (failure, expected) => {
      service.assertMember.mockRejectedValue(failure);

      try {
        await gateway.join(client, { chatRoomId: roomId });
        throw new Error('Expected gateway operation to fail');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(WsException);
        if (!(error instanceof WsException)) {
          throw error;
        }
        expect(error.getError()).toEqual(expected);
      }
    },
  );

  it('does not wrap an existing WsException twice', async () => {
    const failure = new WsException({ statusCode: 400, message: 'bad event' });
    socketSession.authenticate.mockRejectedValue(failure);

    await expect(gateway.join(client, { chatRoomId: roomId })).rejects.toBe(
      failure,
    );
  });

  it('maps middleware authentication failures to connect_error data', async () => {
    let middleware:
      ((client: ChatSocket, next: (error?: Error) => void) => void) | undefined;
    const server = {
      use: jest.fn(
        (
          callback: (client: ChatSocket, next: (error?: Error) => void) => void,
        ) => {
          middleware = callback;
        },
      ),
    };
    gateway.afterInit(
      server as unknown as Parameters<ChatGateway['afterInit']>[0],
    );
    socketSession.authenticate.mockRejectedValue(
      new HttpException('expired', 401),
    );

    await new Promise<void>((resolve, reject) => {
      if (!middleware) {
        reject(new Error('Gateway middleware was not registered'));
        return;
      }
      middleware(client, (error) => {
        try {
          expect(error).toMatchObject({
            message: 'expired',
            data: { statusCode: 401, message: 'expired' },
          });
          resolve();
        } catch (assertionError: unknown) {
          reject(
            assertionError instanceof Error
              ? assertionError
              : new Error('Socket middleware assertion failed'),
          );
        }
      });
    });
  });
});
