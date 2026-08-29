import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { configureApp } from '@/app.factory';
import { AppModule } from '@/app.module';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  account,
  chatMembers,
  chatMessages,
  chatRooms,
  session,
  user,
} from '@/database/schema';
import type {
  ChatClientToServerEvents,
  ChatServerToClientEvents,
  ChatSocketError,
} from '@/modules/chat/chat-socket.types';
import type { ChatMessageResponseDto } from '@/modules/chat/dtos/chat-message-response.dto';
import { SeaweedFsStorageStub } from './stubs/seaweedfs-storage.stub';

type ClientSocket = Socket<ChatServerToClientEvents, ChatClientToServerEvents>;

interface CursorPageData {
  nextCursor: string | null;
  [key: string]: unknown;
}

function readCursorPageData(body: unknown): CursorPageData {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('data' in body) ||
    typeof body.data !== 'object' ||
    body.data === null ||
    !('nextCursor' in body.data) ||
    (body.data.nextCursor !== null && typeof body.data.nextCursor !== 'string')
  ) {
    throw new Error('Expected a cursor-paginated response');
  }
  return body.data;
}

describe('chat sockets (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  let baseUrl: string;
  const userIds: string[] = [];
  const roomIds: string[] = [];
  const sockets: ClientSocket[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SeaweedFsStorageService)
      .useValue(new SeaweedFsStorageStub())
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    db = app.get<DrizzleDB>(DRIZZLE);
  });

  afterEach(async () => {
    for (const socket of sockets.splice(0)) {
      socket.disconnect();
    }
    for (const roomId of roomIds.splice(0)) {
      await db.delete(chatMessages).where(eq(chatMessages.chatRoomId, roomId));
      await db.delete(chatMembers).where(eq(chatMembers.chatRoomId, roomId));
      await db.delete(chatRooms).where(eq(chatRooms.id, roomId));
    }
    for (const userId of userIds.splice(0)) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(account).where(eq(account.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  async function signUp(): Promise<{ userId: string; cookie: string }> {
    const response = await request(baseUrl)
      .post('/api/auth/sign-up/email')
      .send({
        name: 'Chat User',
        fullName: 'Chat Test User',
        email: `chat-${crypto.randomUUID()}@example.test`,
        password: 'Chat-test-password-123!',
        timezone: 'Asia/Bangkok',
      })
      .expect(200);
    const body: unknown = response.body;
    if (
      typeof body !== 'object' ||
      body === null ||
      !('user' in body) ||
      typeof body.user !== 'object' ||
      body.user === null ||
      !('id' in body.user) ||
      typeof body.user.id !== 'string'
    ) {
      throw new Error('Signup did not return a user id');
    }
    const setCookie: unknown = response.headers['set-cookie'];
    if (!Array.isArray(setCookie) || typeof setCookie[0] !== 'string') {
      throw new Error('Signup did not return a session cookie');
    }
    userIds.push(body.user.id);
    return { userId: body.user.id, cookie: setCookie[0].split(';', 1)[0] };
  }

  function connect(cookie?: string): Promise<ClientSocket> {
    const socket: ClientSocket = io(`${baseUrl}/chat`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: cookie ? { Cookie: cookie } : undefined,
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Socket connection timed out')),
        5_000,
      );
      socket.once('connect', () => {
        clearTimeout(timeout);
        resolve(socket);
      });
      socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  it('rejects a Socket.IO handshake without a Better Auth cookie', async () => {
    await expect(connect()).rejects.toMatchObject({
      message: 'Socket authentication required',
      data: { statusCode: 401 },
    });
  });

  it('continues HTTP message history with an opaque cursor', async () => {
    const first = await signUp();
    const second = await signUp();
    const roomId = crypto.randomUUID();
    roomIds.push(roomId);
    await db.insert(chatRooms).values({ id: roomId });
    await db.insert(chatMembers).values([
      { chatRoomId: roomId, memberUserId: first.userId },
      { chatRoomId: roomId, memberUserId: second.userId },
    ]);
    const messageIds = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ];
    await db.insert(chatMessages).values(
      messageIds.map((id, index) => ({
        id,
        chatRoomId: roomId,
        senderUserId: second.userId,
        message: `history-${index}`,
        createdAt: new Date(`2026-08-15T00:0${index}:00.000Z`),
      })),
    );

    const firstPage = await request(baseUrl)
      .get(`/api/v1/chat/rooms/${roomId}/messages?limit=2`)
      .set('Cookie', first.cookie)
      .expect(200);

    const firstPageData = readCursorPageData(firstPage.body as unknown);
    expect(firstPageData).toMatchObject({
      limit: 2,
      hasMore: true,
      items: [{ id: messageIds[2] }, { id: messageIds[1] }],
    });
    expect(typeof firstPageData.nextCursor).toBe('string');

    const secondPage = await request(baseUrl)
      .get(`/api/v1/chat/rooms/${roomId}/messages`)
      .query({ limit: 2, cursor: firstPageData.nextCursor })
      .set('Cookie', first.cookie)
      .expect(200);

    expect(readCursorPageData(secondPage.body as unknown)).toMatchObject({
      limit: 2,
      hasMore: false,
      nextCursor: null,
      items: [{ id: messageIds[0] }],
    });

    await request(baseUrl)
      .get(`/api/v1/chat/rooms/${roomId}/messages?cursor=invalid`)
      .set('Cookie', first.cookie)
      .expect(400);
  });

  it('persists and broadcasts member messages, then advances read state', async () => {
    const first = await signUp();
    const second = await signUp();
    const roomId = crypto.randomUUID();
    roomIds.push(roomId);
    await db.insert(chatRooms).values({ id: roomId });
    await db.insert(chatMembers).values([
      { chatRoomId: roomId, memberUserId: first.userId },
      { chatRoomId: roomId, memberUserId: second.userId },
    ]);

    const firstSocket = await connect(first.cookie);
    const secondSocket = await connect(second.cookie);
    await Promise.all(
      [firstSocket, secondSocket].map(
        (socket) =>
          new Promise<void>((resolve) => {
            socket.emit('chat:join', { chatRoomId: roomId }, () => resolve());
          }),
      ),
    );

    const received = new Promise<ChatMessageResponseDto>((resolve) =>
      secondSocket.once('chat:message', resolve),
    );
    const sent = new Promise<ChatMessageResponseDto>((resolve) =>
      firstSocket.emit(
        'chat:send',
        { chatRoomId: roomId, message: '  Realtime hello  ' },
        resolve,
      ),
    );
    const [sentMessage, receivedMessage] = await Promise.all([sent, received]);

    expect(sentMessage.message).toBe('Realtime hello');
    expect(receivedMessage).toEqual(sentMessage);
    const [stored] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, sentMessage.id));
    expect(stored?.message).toBe('Realtime hello');

    const read = await new Promise<{ lastReadAt: Date }>((resolve) =>
      secondSocket.emit(
        'chat:read',
        { chatRoomId: roomId, messageId: sentMessage.id },
        resolve,
      ),
    );
    expect(new Date(read.lastReadAt).toISOString()).toBe(
      new Date(sentMessage.createdAt).toISOString(),
    );
  });

  it('returns not found when a non-member probes a room', async () => {
    const outsider = await signUp();
    const roomId = crypto.randomUUID();
    roomIds.push(roomId);
    await db.insert(chatRooms).values({ id: roomId });
    const socket = await connect(outsider.cookie);

    const error = await new Promise<ChatSocketError>((resolve) => {
      socket.once('exception', resolve);
      socket.emit('chat:join', { chatRoomId: roomId });
    });

    expect(error).toEqual({ statusCode: 404, message: 'Chat room not found' });
  });
});
