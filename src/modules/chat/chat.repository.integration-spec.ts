import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import { relations } from '@/database/relations';
import { chatMembers, chatMessages, chatRooms, user } from '@/database/schema';
import { ChatRepository } from './chat.repository';

describe('ChatRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: ChatRepository;
  const firstUserId = crypto.randomUUID();
  const secondUserId = crypto.randomUUID();
  const outsiderId = crypto.randomUUID();
  const roomId = crypto.randomUUID();

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, relations });
    repository = new ChatRepository(db);
    await db.insert(user).values(
      [firstUserId, secondUserId, outsiderId].map((id) => ({
        id,
        email: `${id}@example.test`,
        displayName: 'Chat member',
        fullName: 'Chat Member',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db.insert(chatRooms).values({ id: roomId });
    await db.insert(chatMembers).values([
      { chatRoomId: roomId, memberUserId: firstUserId },
      { chatRoomId: roomId, memberUserId: secondUserId },
    ]);
  });

  afterAll(async () => {
    await db.delete(chatMessages).where(eq(chatMessages.chatRoomId, roomId));
    await db.delete(chatMembers).where(eq(chatMembers.chatRoomId, roomId));
    await db.delete(chatRooms).where(eq(chatRooms.id, roomId));
    for (const id of [firstUserId, secondUserId, outsiderId]) {
      await db.delete(user).where(eq(user.id, id));
    }
    await pool.end();
  });

  it('persists messages only for members', async () => {
    await expect(
      repository.findMembership(roomId, firstUserId),
    ).resolves.toEqual(
      expect.objectContaining({
        chatRoomId: roomId,
        memberUserId: firstUserId,
      }),
    );
    await expect(
      repository.findMembership(roomId, outsiderId),
    ).resolves.toBeUndefined();
    await expect(
      repository.createMessageForMember(roomId, outsiderId, 'blocked'),
    ).resolves.toBeUndefined();

    await expect(
      repository.createMessageForMember(roomId, firstUserId, 'allowed'),
    ).resolves.toEqual(
      expect.objectContaining({
        chatRoomId: roomId,
        senderUserId: firstUserId,
        message: 'allowed',
      }),
    );
  });

  it('counts only messages from other members as unread', async () => {
    await repository.createMessageForMember(roomId, secondUserId, 'unread');

    const [room] = await repository.findRoomsForMember(firstUserId, 20, 0);

    expect(room).toEqual(
      expect.objectContaining({ id: roomId, unreadCount: 1 }),
    );
    await expect(repository.countRoomsForMember(firstUserId)).resolves.toBe(1);
    const history = await repository.findMessages(roomId, 100);
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ chatRoomId: roomId, message: 'unread' }),
      ]),
    );
  });

  it('continues message history strictly after the compound cursor', async () => {
    const newest = await repository.createMessageForMember(
      roomId,
      secondUserId,
      'cursor-newest',
    );
    if (!newest) {
      throw new Error('Expected a member message to be created');
    }

    const firstPage = await repository.findMessages(roomId, 2);
    const cursor = firstPage.at(-1);
    if (!cursor) {
      throw new Error('Expected cursor history');
    }
    const secondPage = await repository.findMessages(roomId, 100, cursor);
    const firstPageIds = new Set(firstPage.map(({ id }) => id));

    expect(secondPage.some(({ id }) => firstPageIds.has(id))).toBe(false);
  });

  it('keeps read markers monotonic when an older marker arrives late', async () => {
    const older = await repository.createMessageForMember(
      roomId,
      secondUserId,
      'older',
    );
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newer = await repository.createMessageForMember(
      roomId,
      secondUserId,
      'newer',
    );
    if (!older || !newer) {
      throw new Error('Expected member messages to be created');
    }

    const latestRead = await repository.markReadThroughMessage(
      roomId,
      firstUserId,
      newer.id,
    );
    const delayedRead = await repository.markReadThroughMessage(
      roomId,
      firstUserId,
      older.id,
    );

    expect(delayedRead?.lastReadAt).toEqual(latestRead?.lastReadAt);
    await expect(
      repository.markReadThroughMessage(
        roomId,
        outsiderId,
        '00000000-0000-4000-8000-000000000000',
      ),
    ).resolves.toBeUndefined();
    await expect(
      repository.markReadThroughMessage(
        roomId,
        firstUserId,
        '00000000-0000-4000-8000-000000000000',
      ),
    ).resolves.toBeUndefined();
  });
});
