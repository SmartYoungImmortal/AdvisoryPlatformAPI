import type { NotificationsService } from '@/modules/notifications/notifications.service';
import { ChatMessageNotifier } from './chat-message-notifier';
import type { ChatRepository } from './chat.repository';
import { ChatMessageResponseDto } from './dtos/chat-message-response.dto';

const roomId = '22222222-2222-2222-2222-222222222222';
const sender = '11111111-1111-1111-1111-111111111111';
const recipient = '33333333-3333-3333-3333-333333333333';
const other = '44444444-4444-4444-4444-444444444444';

const message = (text = 'ขอเลื่อนเป็นวันพฤหัสได้ไหม') =>
  new ChatMessageResponseDto({
    id: '55555555-5555-5555-5555-555555555555',
    chatRoomId: roomId,
    senderUserId: sender,
    message: text,
    createdAt: new Date('2026-10-24T10:00:00Z'),
  });

describe('ChatMessageNotifier', () => {
  let repository: jest.Mocked<Pick<ChatRepository, 'findMessageRecipients'>>;
  let notifications: jest.Mocked<Pick<NotificationsService, 'notify'>>;
  let notifier: ChatMessageNotifier;

  beforeEach(() => {
    repository = { findMessageRecipients: jest.fn() };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };
    notifier = new ChatMessageNotifier(
      repository as unknown as ChatRepository,
      notifications as unknown as NotificationsService,
    );
  });

  it('notifies members who are not in the room, titled with the sender in both languages', async () => {
    repository.findMessageRecipients.mockResolvedValue({
      recipientUserIds: [recipient],
      senderName: 'อารยา ส.',
    });

    await notifier.notifyAbsentMembers(message(), new Set());

    expect(notifications.notify).toHaveBeenCalledTimes(1);
    expect(notifications.notify).toHaveBeenCalledWith({
      ownerId: recipient,
      type: 'NEW_MESSAGE',
      title: 'ข้อความใหม่จาก อารยา ส.',
      content: 'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
      en: {
        title: 'New message from อารยา ส.',
        content: 'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
      },
      resourceId: roomId,
    });
  });

  it('skips members who have the room open', async () => {
    repository.findMessageRecipients.mockResolvedValue({
      recipientUserIds: [recipient, other],
      senderName: 'อารยา ส.',
    });

    await notifier.notifyAbsentMembers(message(), new Set([recipient]));

    expect(notifications.notify).toHaveBeenCalledTimes(1);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: other }),
    );
  });

  it('cuts a long message to a preview', async () => {
    repository.findMessageRecipients.mockResolvedValue({
      recipientUserIds: [recipient],
      senderName: null,
    });

    await notifier.notifyAbsentMembers(message('ก'.repeat(300)), new Set());

    const [input] = notifications.notify.mock.calls[0];
    expect(input.content).toBe(`${'ก'.repeat(140)}…`);
    expect(input.title).toBe('ข้อความใหม่จาก ผู้ใช้');
    expect(input.en).toEqual({
      title: 'New message from a user',
      content: `${'ก'.repeat(140)}…`,
    });
  });

  it('does not throw when the lookup fails', async () => {
    repository.findMessageRecipients.mockRejectedValue(new Error('db down'));

    await expect(
      notifier.notifyAbsentMembers(message(), new Set()),
    ).resolves.toBeUndefined();
    expect(notifications.notify).not.toHaveBeenCalled();
  });
});
