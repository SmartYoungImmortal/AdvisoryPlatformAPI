import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import type { SeaweedFsStorageStub } from './stubs/seaweedfs-storage.stub';
import type { DrizzleDB } from '@/database/database.module';
import {
  chatFiles,
  chatMembers,
  chatMessages,
  chatRooms,
} from '@/database/schema';
import { deleteUsers, signUpUser } from './support/accounts';
import { createE2eApp } from './support/e2e-app';
import { object, stringField } from './support/response';

/**
 * AP-033 and AP-037. Proves member-scoped authorization, the 50 MB type/size rule, and
 * that only object keys are persisted, against a real database and the real HTTP stack.
 */
describe('chat files (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  let storage: SeaweedFsStorageStub;
  const createdUserIds: string[] = [];
  const createdRoomIds: string[] = [];

  beforeAll(async () => {
    ({ app, db, storage } = await createE2eApp());
  });

  afterEach(async () => {
    storage.clear();
    for (const id of createdRoomIds.splice(0)) {
      await db.delete(chatFiles).where(eq(chatFiles.chatRoomId, id));
      await db.delete(chatMessages).where(eq(chatMessages.chatRoomId, id));
      await db.delete(chatMembers).where(eq(chatMembers.chatRoomId, id));
      await db.delete(chatRooms).where(eq(chatRooms.id, id));
    }
    await deleteUsers(db, createdUserIds);
  });

  afterAll(async () => {
    await app.close();
  });

  const signUp = () => signUpUser(app, 'Chat file', createdUserIds);

  async function seedRoom() {
    const sender = await signUp();
    const peer = await signUp();
    const outsider = await signUp();

    const [room] = await db
      .insert(chatRooms)
      .values({})
      .returning({ id: chatRooms.id });
    createdRoomIds.push(room.id);
    await db.insert(chatMembers).values([
      { chatRoomId: room.id, memberUserId: sender.userId },
      { chatRoomId: room.id, memberUserId: peer.userId },
    ]);

    return { roomId: room.id, sender, peer, outsider };
  }

  function upload(
    agent: request.Agent,
    roomId: string,
    body: Buffer,
    filename = 'brief.pdf',
    contentType = 'application/pdf',
  ) {
    return agent
      .post(`/api/v1/chat/rooms/${roomId}/files`)
      .attach('file', body, { filename, contentType });
  }

  it('stores an object key rather than a URL and never returns the key', async () => {
    const { roomId, sender } = await seedRoom();

    const response = await upload(
      sender.agent,
      roomId,
      Buffer.from('consultation brief'),
    ).expect(201);
    const file = object(object(response.body).data);

    expect(file).toMatchObject({
      chatRoomId: roomId,
      senderUserId: sender.userId,
      originalFileName: 'brief.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 18,
    });
    expect(file.objectKey).toBeUndefined();

    const [row] = await db
      .select({ objectKey: chatFiles.objectKey })
      .from(chatFiles)
      .where(eq(chatFiles.id, stringField(file, 'id')));
    expect(row.objectKey).toMatch(
      new RegExp(`^chat-files/${roomId}/.*\\.pdf$`),
    );
    expect(row.objectKey).not.toMatch(/^https?:/);
    expect(storage.hasObject(row.objectKey)).toBe(true);
  });

  it('lets any member download and lists the file in the room feed', async () => {
    const { roomId, sender, peer } = await seedRoom();
    const uploaded = await upload(
      sender.agent,
      roomId,
      Buffer.from('shared'),
    ).expect(201);
    const fileId = stringField(object(object(uploaded.body).data), 'id');

    const download = await peer.agent
      .get(`/api/v1/chat/rooms/${roomId}/files/${fileId}`)
      .expect(200);
    const link = object(object(download.body).data);
    expect(link.url).toEqual(expect.stringContaining('https://storage.'));
    expect(link.expiresInSeconds).toBe(300);

    const feed = await peer.agent
      .get(`/api/v1/chat/rooms/${roomId}/files`)
      .expect(200);
    const page = object(object(feed.body).data);
    expect(page.items).toHaveLength(1);
    expect(page.hasMore).toBe(false);
  });

  it('hides the room from a non-member on every file route', async () => {
    const { roomId, sender, outsider } = await seedRoom();
    const uploaded = await upload(
      sender.agent,
      roomId,
      Buffer.from('private'),
    ).expect(201);
    const fileId = stringField(object(object(uploaded.body).data), 'id');

    await outsider.agent.get(`/api/v1/chat/rooms/${roomId}/files`).expect(404);
    await outsider.agent
      .get(`/api/v1/chat/rooms/${roomId}/files/${fileId}`)
      .expect(404);
    await outsider.agent
      .delete(`/api/v1/chat/rooms/${roomId}/files/${fileId}`)
      .expect(404);
    await upload(outsider.agent, roomId, Buffer.from('intrusion')).expect(404);
  });

  it('requires a session', async () => {
    const { roomId } = await seedRoom();

    await request(app.getHttpServer())
      .get(`/api/v1/chat/rooms/${roomId}/files`)
      .expect(401);
  });

  it('rejects a type outside the allowlist without storing anything', async () => {
    const { roomId, sender } = await seedRoom();

    await upload(
      sender.agent,
      roomId,
      Buffer.from('MZ'),
      'payload.exe',
      'application/x-msdownload',
    ).expect(400);

    const rows = await db
      .select({ id: chatFiles.id })
      .from(chatFiles)
      .where(eq(chatFiles.chatRoomId, roomId));
    expect(rows).toHaveLength(0);
  });

  it('lets only the sender remove a file, and removes the object with the row', async () => {
    const { roomId, sender, peer } = await seedRoom();
    const uploaded = await upload(
      sender.agent,
      roomId,
      Buffer.from('removable'),
    ).expect(201);
    const fileId = stringField(object(object(uploaded.body).data), 'id');
    const [row] = await db
      .select({ objectKey: chatFiles.objectKey })
      .from(chatFiles)
      .where(eq(chatFiles.id, fileId));

    await peer.agent
      .delete(`/api/v1/chat/rooms/${roomId}/files/${fileId}`)
      .expect(403);
    expect(storage.hasObject(row.objectKey)).toBe(true);

    const removed = await sender.agent
      .delete(`/api/v1/chat/rooms/${roomId}/files/${fileId}`)
      .expect(200);
    expect(object(object(removed.body).data).id).toBe(fileId);
    expect(storage.hasObject(row.objectKey)).toBe(false);

    const rows = await db
      .select({ id: chatFiles.id })
      .from(chatFiles)
      .where(eq(chatFiles.id, fileId));
    expect(rows).toHaveLength(0);
  });

  it('does not resolve a file id belonging to another room', async () => {
    const first = await seedRoom();
    const second = await seedRoom();
    const uploaded = await upload(
      first.sender.agent,
      first.roomId,
      Buffer.from('room one'),
    ).expect(201);
    const fileId = stringField(object(object(uploaded.body).data), 'id');

    await second.sender.agent
      .get(`/api/v1/chat/rooms/${second.roomId}/files/${fileId}`)
      .expect(404);
  });
});
