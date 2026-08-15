import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gt,
  isNull,
  lt,
  ne,
  or,
  sql,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import type { KeysetCursor } from '@/common/pagination/cursor-pagination.dto';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { chatMembers, chatMessages, chatRooms, user } from '@/database/schema';
import { CompositeKeyStore } from '@/common/repositories/composite-key.store';
import type { ChatReadView } from './dtos/chat-read-response.dto';
import type { ChatRoomView } from './dtos/chat-room-response.dto';

type ChatMember = InferSelectModel<typeof chatMembers>;
type ChatMessage = InferSelectModel<typeof chatMessages>;

const chatMembershipKey = {
  chatRoomId: chatMembers.chatRoomId,
  memberUserId: chatMembers.memberUserId,
} as const;

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
        createdAt: chatMembers.createdAt,
      })
      .from(chatMembers)
      .innerJoin(user, eq(user.id, chatMembers.memberUserId))
      .where(this.activeMembershipWhere(chatRoomId, memberUserId))
      .limit(1);
    return membership;
  }

  async findRoomsForMember(
    memberUserId: string,
    limit: number,
    offset: number,
  ): Promise<ChatRoomView[]> {
    const rows = await this.db
      .select({
        id: chatRooms.id,
        isAnonymous: chatRooms.isAnonymous,
        lastReadAt: chatMembers.lastReadAt,
        unreadCount: count(chatMessages.id),
        createdAt: chatRooms.createdAt,
      })
      .from(chatMembers)
      .innerJoin(chatRooms, eq(chatRooms.id, chatMembers.chatRoomId))
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
      .where(eq(chatMembers.memberUserId, memberUserId))
      .groupBy(
        chatRooms.id,
        chatRooms.isAnonymous,
        chatRooms.createdAt,
        chatMembers.lastReadAt,
      )
      .orderBy(desc(chatRooms.createdAt), desc(chatRooms.id))
      .limit(limit)
      .offset(offset);

    return rows;
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
        .select({ createdAt: chatMessages.createdAt })
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

      const [updated] = await tx
        .update(chatMembers)
        .set({
          lastReadAt: sql<Date>`greatest(coalesce(${chatMembers.lastReadAt}, '-infinity'::timestamptz), ${message.createdAt})`,
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
}
