import type { NestExpressApplication } from '@nestjs/platform-express';
import { and, eq, inArray } from 'drizzle-orm';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import type { DrizzleDB } from '@/database/database.module';
import {
  chatMembers,
  chatMessages,
  chatRooms,
  notifications,
} from '@/database/schema';
import type {
  ChatClientToServerEvents,
  ChatServerToClientEvents,
} from '@/modules/chat/chat-socket.types';
import type { ChatMessageResponseDto } from '@/modules/chat/dtos/chat-message-response.dto';
import { deleteUsers, signUpUser, type SignedUpUser } from './support/accounts';
import { createE2eApp } from './support/e2e-app';
import { data, object } from './support/response';

type ClientSocket = Socket<ChatServerToClientEvents, ChatClientToServerEvents>;

/**
 * A member who mutes a room keeps getting its messages and its unread count, but a new
 * message raises no NEW_MESSAGE notification (and so no push) for them until they unmute.
 */
describe('chat room mute (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  let baseUrl: string;
  const createdUserIds: string[] = [];
  const createdRoomIds: string[] = [];
  const sockets: ClientSocket[] = [];

  beforeAll(async () => {
    ({ app, db } = await createE2eApp());
    // The sender talks over the socket gateway, which needs a listening server.
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterEach(async () => {
    for (const socket of sockets.splice(0)) {
      socket.disconnect();
    }
    const roomIds = createdRoomIds.splice(0);
    if (roomIds.length > 0) {
      await db
        .delete(chatMessages)
        .where(inArray(chatMessages.chatRoomId, roomIds));
      await db
        .delete(chatMembers)
        .where(inArray(chatMembers.chatRoomId, roomIds));
      await db.delete(chatRooms).where(inArray(chatRooms.id, roomIds));
    }
    if (createdUserIds.length > 0) {
      await db
        .delete(notifications)
        .where(inArray(notifications.ownerId, createdUserIds));
    }
    await deleteUsers(db, createdUserIds);
  });

  afterAll(async () => {
    await app.close();
  });

  const signUp = (label: string) => signUpUser(app, label, createdUserIds);

  async function seedRoom(...members: SignedUpUser[]): Promise<string> {
    const roomId = crypto.randomUUID();
    createdRoomIds.push(roomId);
    await db.insert(chatRooms).values({ id: roomId });
    await db.insert(chatMembers).values(
      members.map(({ userId }) => ({
        chatRoomId: roomId,
        memberUserId: userId,
      })),
    );
    return roomId;
  }

  /** A fresh session cookie for the socket handshake, which cannot share the agent's jar. */
  async function sessionCookie(member: SignedUpUser): Promise<string> {
    const response = await request(baseUrl)
      .post('/api/auth/sign-in/email')
      .send({ email: member.email, password: member.password })
      .expect(200);
    const setCookie: unknown = response.headers['set-cookie'];
    if (!Array.isArray(setCookie) || setCookie.length === 0) {
      throw new TypeError('Sign-in did not return a session cookie');
    }
    return setCookie
      .map((cookie) => String(cookie).split(';', 1)[0])
      .join('; ');
  }

  async function connect(member: SignedUpUser): Promise<ClientSocket> {
    const socket: ClientSocket = io(`${baseUrl}/chat`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: { Cookie: await sessionCookie(member) },
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

  /** Resolves once the gateway has saved the message and run its notifications. */
  function send(
    socket: ClientSocket,
    chatRoomId: string,
    message: string,
  ): Promise<ChatMessageResponseDto> {
    return new Promise((resolve) =>
      socket.emit('chat:send', { chatRoomId, message }, resolve),
    );
  }

  function messageNotifications(ownerId: string, roomId: string) {
    return db
      .select({ id: notifications.id, content: notifications.content })
      .from(notifications)
      .where(
        and(
          eq(notifications.ownerId, ownerId),
          eq(notifications.type, 'NEW_MESSAGE'),
          eq(notifications.resourceId, roomId),
        ),
      );
  }

  it('withholds message notifications from a member while they have the room muted', async () => {
    const muter = await signUp('Chat mute');
    const sender = await signUp('Chat mute sender');
    const roomId = await seedRoom(muter, sender);

    const muted = await muter.agent
      .patch(`/api/v1/chat/rooms/${roomId}/mute`)
      .send({ muted: true })
      .expect(200);
    expect(object(muted.body).message).toBe('Chat room mute updated');
    expect(data(muted.body)).toMatchObject({
      id: roomId,
      isMuted: true,
      unreadCount: 0,
    });
    // Muting again is a no-op that answers the same room.
    const again = await muter.agent
      .patch(`/api/v1/chat/rooms/${roomId}/mute`)
      .send({ muted: true })
      .expect(200);
    expect(data(again.body)).toMatchObject({ id: roomId, isMuted: true });

    const senderSocket = await connect(sender);
    const whileMuted = await send(senderSocket, roomId, 'while muted');
    expect(whileMuted.message).toBe('while muted');

    await expect(messageNotifications(muter.userId, roomId)).resolves.toEqual(
      [],
    );
    // The message itself is unaffected: stored, listed and counted as unread.
    const rooms = await muter.agent.get('/api/v1/chat/rooms').expect(200);
    expect(data(rooms.body).items).toEqual([
      expect.objectContaining({
        id: roomId,
        isMuted: true,
        unreadCount: 1,
        lastMessage: expect.objectContaining({ id: whileMuted.id }) as unknown,
      }),
    ]);

    const unmuted = await muter.agent
      .patch(`/api/v1/chat/rooms/${roomId}/mute`)
      .send({ muted: false })
      .expect(200);
    expect(data(unmuted.body)).toMatchObject({ id: roomId, isMuted: false });

    await send(senderSocket, roomId, 'after unmute');

    // Only the message sent after unmuting notifies; nothing is backfilled.
    await expect(messageNotifications(muter.userId, roomId)).resolves.toEqual([
      expect.objectContaining({ content: 'after unmute' }),
    ]);
  });

  it('keeps one member muting the room from silencing the other', async () => {
    const muter = await signUp('Chat mute');
    const other = await signUp('Chat mute other');
    const roomId = await seedRoom(muter, other);
    await muter.agent
      .patch(`/api/v1/chat/rooms/${roomId}/mute`)
      .send({ muted: true })
      .expect(200);

    const muterSocket = await connect(muter);
    await send(muterSocket, roomId, 'from the muter');

    await expect(messageNotifications(other.userId, roomId)).resolves.toEqual([
      expect.objectContaining({ content: 'from the muter' }),
    ]);
    const rooms = await other.agent.get('/api/v1/chat/rooms').expect(200);
    expect(data(rooms.body).items).toEqual([
      expect.objectContaining({ id: roomId, isMuted: false }),
    ]);
  });

  it('answers a non-member with the same not found as the other room routes', async () => {
    const member = await signUp('Chat mute');
    const outsider = await signUp('Chat mute outsider');
    const roomId = await seedRoom(member);

    const response = await outsider.agent
      .patch(`/api/v1/chat/rooms/${roomId}/mute`)
      .send({ muted: true })
      .expect(404);
    expect(object(response.body).message).toBe('Chat room not found');
    await outsider.agent
      .get(`/api/v1/chat/rooms/${roomId}/messages`)
      .expect(404);

    const [membership] = await db
      .select({ mutedAt: chatMembers.mutedAt })
      .from(chatMembers)
      .where(eq(chatMembers.chatRoomId, roomId));
    expect(membership?.mutedAt).toBeNull();
  });

  it('requires a boolean `muted`', async () => {
    const member = await signUp('Chat mute');
    const roomId = await seedRoom(member);

    await Promise.all(
      [{}, { muted: 'true' }, { muted: 1 }].map((body) =>
        member.agent
          .patch(`/api/v1/chat/rooms/${roomId}/mute`)
          .send(body)
          .expect(400),
      ),
    );
    await request(baseUrl)
      .patch(`/api/v1/chat/rooms/${roomId}/mute`)
      .send({ muted: true })
      .expect(401);
  });
});
