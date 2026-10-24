import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { ChatRepository } from './chat.repository';
import type { ChatMessageResponseDto } from './dtos/chat-message-response.dto';

const PREVIEW_LENGTH = 140;
const FALLBACK_SENDER = 'ผู้ใช้';

/**
 * Turns a sent chat message into a notification (and device push) for the members who are not
 * looking at the room. Members with a socket in the room already got the message live.
 */
@Injectable()
export class ChatMessageNotifier {
  private readonly logger = new Logger(ChatMessageNotifier.name);

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly notifications: NotificationsService,
  ) {}

  /** Never throws: a notification problem must not fail the message that was already saved. */
  async notifyAbsentMembers(
    message: ChatMessageResponseDto,
    presentUserIds: ReadonlySet<string>,
  ): Promise<void> {
    try {
      const { recipientUserIds, senderName } =
        await this.chatRepository.findMessageRecipients(
          message.chatRoomId,
          message.senderUserId,
        );
      const preview =
        message.message.length > PREVIEW_LENGTH
          ? `${message.message.slice(0, PREVIEW_LENGTH)}…`
          : message.message;

      await Promise.all(
        recipientUserIds
          .filter((userId) => !presentUserIds.has(userId))
          .map((ownerId) =>
            this.notifications.notify({
              ownerId,
              type: 'NEW_MESSAGE',
              title: `ข้อความใหม่จาก ${senderName ?? FALLBACK_SENDER}`,
              content: preview,
              resourceId: message.chatRoomId,
            }),
          ),
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Could not notify room ${message.chatRoomId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
