import { NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { chatMembers, chatMessages } from '@/database/schema';
import type { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dtos/chat-query.dto';

type ChatMember = InferSelectModel<typeof chatMembers>;
type ChatMessage = InferSelectModel<typeof chatMessages>;

const roomId = '11111111-1111-4111-8111-111111111111';
const memberId = '22222222-2222-4222-8222-222222222222';
const messageId = '33333333-3333-4333-8333-333333333333';

function message(): ChatMessage {
  return {
    id: messageId,
    chatRoomId: roomId,
    senderUserId: memberId,
    message: 'Hello',
    createdAt: new Date('2026-08-15T00:00:00Z'),
  };
}

function membership(): ChatMember {
  return {
    chatRoomId: roomId,
    memberUserId: memberId,
    lastReadAt: null,
    createdAt: new Date('2026-08-15T00:00:00Z'),
  };
}

describe('ChatService', () => {
  let service: ChatService;
  let repository: jest.Mocked<
    Pick<
      ChatRepository,
      | 'findMembership'
      | 'findRoomsForMember'
      | 'countRoomsForMember'
      | 'findMessages'
      | 'countMessages'
      | 'createMessageForMember'
      | 'markReadThroughMessage'
    >
  >;

  beforeEach(() => {
    repository = {
      findMembership: jest.fn(),
      findRoomsForMember: jest.fn(),
      countRoomsForMember: jest.fn(),
      findMessages: jest.fn(),
      countMessages: jest.fn(),
      createMessageForMember: jest.fn(),
      markReadThroughMessage: jest.fn(),
    };
    service = new ChatService(repository as unknown as ChatRepository);
  });

  it('returns only the current member rooms with unread counts', async () => {
    const query = new ChatQueryDto();
    repository.findRoomsForMember.mockResolvedValue([
      {
        id: roomId,
        isAnonymous: false,
        lastReadAt: null,
        unreadCount: 2,
        createdAt: new Date('2026-08-15T00:00:00Z'),
      },
    ]);
    repository.countRoomsForMember.mockResolvedValue(1);

    await expect(service.findRooms(memberId, query)).resolves.toEqual({
      items: [expect.objectContaining({ id: roomId, unreadCount: 2 })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it('returns deterministic paginated room history to a member', async () => {
    const query = Object.assign(new ChatQueryDto(), { page: 2, limit: 10 });
    repository.findMembership.mockResolvedValue(membership());
    repository.findMessages.mockResolvedValue([message()]);
    repository.countMessages.mockResolvedValue(11);

    const result = await service.findMessages(memberId, roomId, query);

    expect(repository.findMessages).toHaveBeenCalledWith(roomId, 10, 10);
    expect(result.items[0]).toEqual(expect.objectContaining({ id: messageId }));
    expect(result.totalPages).toBe(2);
  });

  it('hides a room probe from a non-member behind not found', async () => {
    repository.findMembership.mockResolvedValue(undefined);

    await expect(
      service.findMessages(memberId, roomId, new ChatQueryDto()),
    ).rejects.toThrow(NotFoundException);
    expect(repository.findMessages).not.toHaveBeenCalled();
  });

  it('persists a member message and rejects a non-member atomically', async () => {
    repository.createMessageForMember.mockResolvedValueOnce(message());
    await expect(
      service.sendMessage(memberId, roomId, 'Hello'),
    ).resolves.toEqual(expect.objectContaining({ id: messageId }));

    repository.createMessageForMember.mockResolvedValueOnce(undefined);
    await expect(
      service.sendMessage(memberId, roomId, 'No access'),
    ).rejects.toThrow(NotFoundException);
  });

  it('marks through a room message and rejects an unknown message', async () => {
    repository.findMembership.mockResolvedValue(membership());
    repository.markReadThroughMessage.mockResolvedValueOnce({
      chatRoomId: roomId,
      memberUserId: memberId,
      messageId,
      lastReadAt: message().createdAt,
    });

    await expect(
      service.markRead(memberId, roomId, messageId),
    ).resolves.toEqual(expect.objectContaining({ messageId }));

    repository.markReadThroughMessage.mockResolvedValueOnce(undefined);
    await expect(service.markRead(memberId, roomId, messageId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
