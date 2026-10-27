import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { KeysetCursor } from '@/common/pagination/cursor-pagination.dto';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  chatFiles,
  chatMembers,
  chatMessages,
  chatRooms,
  user,
} from '@/database/schema';
import { CompositeKeyStore } from '@/common/repositories/composite-key.store';
import type { ChatFile } from './dtos/chat-file-response.dto';
import type { ChatReadView } from './dtos/chat-read-response.dto';
import type { ChatRoomView } from './dtos/chat-room-response.dto';

type ChatMember = InferSelectModel<typeof chatMembers>;
type ChatMessage = InferSelectModel<typeof chatMessages>;

const chatMembershipKey = {
  chatRoomId: chatMembers.chatRoomId,
  memberUserId: chatMembers.memberUserId,
} as const;

/**
 * The room list reads `chat_members` and `user` a second time, for the other side
 * of each room, so those reads get their own names.
 */
const otherMember = alias(chatMembers, 'other_member');
const otherUser = alias(user, 'other_user');
/** And `chat_messages` a second time, for each room's newest line. */
const newestMessage = alias(chatMessages, 'newest_message');

@Injectable()
export class ChatRepository {
  private readonly memberships: CompositeKeyStore<
    typeof chatMembers,
    typeof chatMembershipKey
  >;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    this.memberships = new CompositeKeyStore(
      db,
      chatMembers,
      chatMembershipKey,
    );
  }

  private activeMembershipWhere(chatRoomId: string, memberUserId: string): SQL {
    return and(
      this.memberships.where({ chatRoomId, memberUserId }),
      eq(user.status, 'ACTIVE'),
    ) as SQL;
  }

  async findMembership(
    chatRoomId: string,
    memberUserId: string,
  ): Promise<ChatMember | undefined> {
    const [membership] = await this.db
      .select({
        chatRoomId: chatMembers.chatRoomId,
        memberUserId: chatMembers.memberUserId,
        lastReadAt: chatMembers.lastReadAt,
        mutedAt: chatMembers.mutedAt,
        createdAt: chatMembers.createdAt,
      })
      .from(chatMembers)
      .innerJoin(user, eq(user.id, chatMembers.memberUserId))
      .where(this.activeMembershipWhere(chatRoomId, memberUserId))
      .limit(1);
    return membership;
  }

  /**
   * Mutes or unmutes the room for an active member, and says whether they are one. Muting
   * a muted room keeps the time it was first muted, so the call is safe to repeat.
   */
  async setMutedForMember(
    chatRoomId: string,
    memberUserId: string,
    muted: boolean,
  ): Promise<boolean> {
    const activeUserIds = this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.status, 'ACTIVE'));
    const [updated] = await this.db
      .update(chatMembers)
      .set({
        mutedAt: muted ? sql`coalesce(${chatMembers.mutedAt}, now())` : null,
      })
      .where(
        and(
          this.memberships.where({ chatRoomId, memberUserId }),
          inArray(chatMembers.memberUserId, activeUserIds),
        ),
      )
      .returning({ chatRoomId: chatMembers.chatRoomId });
    return updated !== undefined;
  }

  /**
   * The room's active members other than the sender who have not muted it, and the
   * sender's name for a notification. A muted member still gets the message; only the
   * notification and its push are withheld.
   */
  async findMessageRecipients(
    chatRoomId: string,
    senderUserId: string,
  ): Promise<{ recipientUserIds: string[]; senderName: string | null }> {
    const [recipients, [sender]] = await Promise.all([
      this.db
        .select({ memberUserId: chatMembers.memberUserId })
        .from(chatMembers)
        .innerJoin(user, eq(user.id, chatMembers.memberUserId))
        .where(
          and(
            eq(chatMembers.chatRoomId, chatRoomId),
            ne(chatMembers.memberUserId, senderUserId),
            eq(user.status, 'ACTIVE'),
            isNull(chatMembers.mutedAt),
          ),
        ),
      this.db
        .select({ fullName: user.fullName })
        .from(user)
        .where(eq(user.id, senderUserId))
        .limit(1),
    ]);
    return {
      recipientUserIds: recipients.map((row) => row.memberUserId),
      senderName: sender?.fullName ?? null,
    };
  }

  /**
   * The member's rooms, each with its unread count and the other member.
   *
   * The other member is a lateral subquery limited to one row, the earliest to
   * join, so a room can never come back twice or count its unread lines twice
   * however many members it holds. A booking's room holds exactly two.
   */
  findRoomsForMember(
    memberUserId: string,
    limit: number,
    offset: number,
  ): Promise<ChatRoomView[]> {
    return this.selectRoomsForMember(memberUserId, { limit, offset });
  }

  /** One of the member's rooms, read exactly as the room list reads it. */
  async findRoomForMember(
    memberUserId: string,
    chatRoomId: string,
  ): Promise<ChatRoomView | undefined> {
    const [room] = await this.selectRoomsForMember(memberUserId, {
      limit: 1,
      offset: 0,
      chatRoomId,
    });
    return room;
  }

  private async selectRoomsForMember(
    memberUserId: string,
    {
      limit,
      offset,
      chatRoomId,
    }: { limit: number; offset: number; chatRoomId?: string },
  ): Promise<ChatRoomView[]> {
    const counterpart = this.db
      .select({
        id: otherUser.id,
        displayName: otherUser.displayName,
        image: otherUser.image,
      })
      .from(otherMember)
      .innerJoin(otherUser, eq(otherUser.id, otherMember.memberUserId))
      .where(
        and(
          eq(otherMember.chatRoomId, chatMembers.chatRoomId),
          ne(otherMember.memberUserId, memberUserId),
        ),
      )
      .orderBy(otherMember.createdAt, otherMember.memberUserId)
      .limit(1)
      .as('counterpart');

    // The room's newest line, in the order `findMessages` reads a room, so the
    // list can show it without reading every room's first page.
    const lastMessage = this.db
      .select({
        id: newestMessage.id,
        senderUserId: newestMessage.senderUserId,
        message: newestMessage.message,
        createdAt: newestMessage.createdAt,
      })
      .from(newestMessage)
      .where(eq(newestMessage.chatRoomId, chatMembers.chatRoomId))
      .orderBy(desc(newestMessage.createdAt), desc(newestMessage.id))
      .limit(1)
      .as('last_message');

    const rows = await this.db
      .select({
        id: chatRooms.id,
        isAnonymous: chatRooms.isAnonymous,
        lastReadAt: chatMembers.lastReadAt,
        isMuted: sql<boolean>`${chatMembers.mutedAt} is not null`,
        unreadCount: count(chatMessages.id),
        createdAt: chatRooms.createdAt,
        counterpartId: counterpart.id,
        counterpartDisplayName: counterpart.displayName,
        counterpartImage: counterpart.image,
        lastMessageId: lastMessage.id,
        lastMessageSenderUserId: lastMessage.senderUserId,
        lastMessageText: lastMessage.message,
        lastMessageCreatedAt: lastMessage.createdAt,
      })
      .from(chatMembers)
      .innerJoin(chatRooms, eq(chatRooms.id, chatMembers.chatRoomId))
      .leftJoinLateral(counterpart, sql`true`)
      .leftJoinLateral(lastMessage, sql`true`)
      .leftJoin(
        chatMessages,
        and(
          eq(chatMessages.chatRoomId, chatMembers.chatRoomId),
          ne(chatMessages.senderUserId, memberUserId),
          or(
            isNull(chatMembers.lastReadAt),
            gt(chatMessages.createdAt, chatMembers.lastReadAt),
          ),
        ),
      )
      .where(
        and(
          eq(chatMembers.memberUserId, memberUserId),
          chatRoomId ? eq(chatMembers.chatRoomId, chatRoomId) : undefined,
        ),
      )
      .groupBy(
        chatRooms.id,
        chatRooms.isAnonymous,
        chatRooms.createdAt,
        chatMembers.lastReadAt,
        chatMembers.mutedAt,
        counterpart.id,
        counterpart.displayName,
        counterpart.image,
        lastMessage.id,
        lastMessage.senderUserId,
        lastMessage.message,
        lastMessage.createdAt,
      )
      .orderBy(desc(chatRooms.createdAt), desc(chatRooms.id))
      .limit(limit)
      .offset(offset);

    return rows.map(
      ({
        counterpartId,
        counterpartDisplayName,
        counterpartImage,
        lastMessageId,
        lastMessageSenderUserId,
        lastMessageText,
        lastMessageCreatedAt,
        ...room
      }) => ({
        ...room,
        counterpart:
          counterpartId && counterpartDisplayName !== null
            ? {
                id: counterpartId,
                displayName: counterpartDisplayName,
                image: counterpartImage,
              }
            : null,
        lastMessage:
          lastMessageId &&
          lastMessageSenderUserId &&
          lastMessageText !== null &&
          lastMessageCreatedAt
            ? {
                id: lastMessageId,
                chatRoomId: room.id,
                senderUserId: lastMessageSenderUserId,
                message: lastMessageText,
                createdAt: lastMessageCreatedAt,
              }
            : null,
      }),
    );
  }

  async countRoomsForMember(memberUserId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(chatMembers)
      .where(eq(chatMembers.memberUserId, memberUserId));
    return row?.value ?? 0;
  }

  findMessages(
    chatRoomId: string,
    limit: number,
    cursor?: KeysetCursor,
  ): Promise<ChatMessage[]> {
    return this.db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatRoomId, chatRoomId),
          cursor
            ? or(
                lt(chatMessages.createdAt, cursor.createdAt),
                and(
                  eq(chatMessages.createdAt, cursor.createdAt),
                  lt(chatMessages.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
      .limit(limit);
  }

  createMessageForMember(
    chatRoomId: string,
    senderUserId: string,
    message: string,
  ): Promise<ChatMessage | undefined> {
    return this.db.transaction(async (tx) => {
      const [membership] = await tx
        .select({ chatRoomId: chatMembers.chatRoomId })
        .from(chatMembers)
        .innerJoin(user, eq(user.id, chatMembers.memberUserId))
        .where(this.activeMembershipWhere(chatRoomId, senderUserId))
        .limit(1);

      if (!membership) {
        return undefined;
      }

      const [created] = await tx
        .insert(chatMessages)
        .values({ chatRoomId, senderUserId, message })
        .returning();
      return created;
    });
  }

  markReadThroughMessage(
    chatRoomId: string,
    memberUserId: string,
    messageId: string,
  ): Promise<ChatReadView | undefined> {
    return this.db.transaction(async (tx) => {
      const [membership] = await tx
        .select({ chatRoomId: chatMembers.chatRoomId })
        .from(chatMembers)
        .innerJoin(user, eq(user.id, chatMembers.memberUserId))
        .where(this.activeMembershipWhere(chatRoomId, memberUserId))
        .limit(1);

      if (!membership) {
        return undefined;
      }

      const [message] = await tx
        .select({ id: chatMessages.id })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.id, messageId),
            eq(chatMessages.chatRoomId, chatRoomId),
          ),
        )
        .limit(1);

      if (!message) {
        return undefined;
      }

      // The marker is read from the row in SQL, not passed back from JS: a `Date`
      // keeps milliseconds and `created_at` keeps microseconds, so a round trip
      // put the marker a fraction before the message and left it unread.
      const [updated] = await tx
        .update(chatMembers)
        .set({
          lastReadAt: sql<Date>`greatest(coalesce(${chatMembers.lastReadAt}, '-infinity'::timestamptz), (select ${chatMessages.createdAt} from ${chatMessages} where ${chatMessages.id} = ${message.id}))`,
        })
        .where(this.memberships.where({ chatRoomId, memberUserId }))
        .returning({
          chatRoomId: chatMembers.chatRoomId,
          memberUserId: chatMembers.memberUserId,
          lastReadAt: chatMembers.lastReadAt,
        });

      if (!updated?.lastReadAt) {
        return undefined;
      }

      return { ...updated, messageId, lastReadAt: updated.lastReadAt };
    });
  }

  /** Mirrors createMessageForMember: membership is rechecked inside the write. */
  createFileForMember(
    chatRoomId: string,
    senderUserId: string,
    values: {
      objectKey: string;
      originalFileName: string;
      mimeType: string;
      fileSizeBytes: number;
      expiryDate: Date;
    },
  ): Promise<ChatFile | undefined> {
    return this.db.transaction(async (tx) => {
      const [membership] = await tx
        .select({ chatRoomId: chatMembers.chatRoomId })
        .from(chatMembers)
        .innerJoin(user, eq(user.id, chatMembers.memberUserId))
        .where(this.activeMembershipWhere(chatRoomId, senderUserId))
        .limit(1);

      if (!membership) {
        return undefined;
      }

      const [created] = await tx
        .insert(chatFiles)
        .values({ chatRoomId, senderUserId, ...values })
        .returning();
      return created;
    });
  }

  findFiles(
    chatRoomId: string,
    limit: number,
    cursor?: KeysetCursor,
  ): Promise<ChatFile[]> {
    return this.db
      .select()
      .from(chatFiles)
      .where(
        and(
          eq(chatFiles.chatRoomId, chatRoomId),
          cursor
            ? or(
                lt(chatFiles.createdAt, cursor.createdAt),
                and(
                  eq(chatFiles.createdAt, cursor.createdAt),
                  lt(chatFiles.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(chatFiles.createdAt), desc(chatFiles.id))
      .limit(limit);
  }

  /** Scoped by room so a member of one room cannot resolve another room file id. */
  async findFileInRoom(
    chatRoomId: string,
    fileId: string,
  ): Promise<ChatFile | undefined> {
    const [file] = await this.db
      .select()
      .from(chatFiles)
      .where(
        and(eq(chatFiles.id, fileId), eq(chatFiles.chatRoomId, chatRoomId)),
      )
      .limit(1);
    return file;
  }

  async deleteFileInRoom(
    chatRoomId: string,
    fileId: string,
  ): Promise<ChatFile | undefined> {
    const [deleted] = await this.db
      .delete(chatFiles)
      .where(
        and(eq(chatFiles.id, fileId), eq(chatFiles.chatRoomId, chatRoomId)),
      )
      .returning();
    return deleted;
  }
}
