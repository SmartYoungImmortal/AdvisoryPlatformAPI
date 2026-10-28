import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CursorPaginationDto,
  encodeKeysetCursor,
} from '@/common/pagination/cursor-pagination.dto';
import type { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import type { PushService } from './push/push.service';
import type { Notification } from './notifications.types';

const ownerId = '11111111-1111-1111-1111-111111111111';
const roomId = '22222222-2222-2222-2222-222222222222';

const makeNotification = (
  overrides: Partial<Notification> = {},
): Notification => ({
  id: '33333333-3333-3333-3333-333333333333',
  ownerId,
  type: 'SCREENING_REQUESTED',
  title: 'มีคำขอคัดกรองใหม่',
  content: 'อารยา ส. ส่งคำตอบคัดกรอง 3 ข้อ',
  resourceId: '44444444-4444-4444-4444-444444444444',
  isRead: false,
  createdAt: new Date('2026-10-13T08:00:00Z'),
  ...overrides,
});

const query = (overrides: Partial<CursorPaginationDto> = {}) =>
  Object.assign(new CursorPaginationDto(), overrides);

describe('NotificationsService', () => {
  let repository: jest.Mocked<
    Pick<
      NotificationsRepository,
      | 'findPageForOwner'
      | 'countUnread'
      | 'markRead'
      | 'markAllRead'
      | 'createWithTranslations'
      | 'createWelcome'
      | 'upsertUnreadMessage'
    >
  >;
  let push: jest.Mocked<Pick<PushService, 'sendToUser'>>;
  let service: NotificationsService;

  beforeEach(() => {
    push = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    repository = {
      findPageForOwner: jest.fn(),
      countUnread: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      createWithTranslations: jest.fn(),
      createWelcome: jest.fn(),
      upsertUnreadMessage: jest.fn(),
    };
    service = new NotificationsService(
      repository as unknown as NotificationsRepository,
      push as unknown as PushService,
    );
  });

  describe('findMine', () => {
    it('returns one page and a cursor when there is more', async () => {
      const rows = [
        makeNotification({ id: '33333333-3333-3333-3333-333333333331' }),
        makeNotification({ id: '33333333-3333-3333-3333-333333333332' }),
        makeNotification({ id: '33333333-3333-3333-3333-333333333333' }),
      ];
      repository.findPageForOwner.mockResolvedValue(rows);

      const page = await service.findMine(ownerId, query({ limit: 2 }));

      expect(repository.findPageForOwner).toHaveBeenCalledWith(
        ownerId,
        3,
        undefined,
      );
      expect(page.items).toHaveLength(2);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBe(
        encodeKeysetCursor({ createdAt: rows[1].createdAt, id: rows[1].id }),
      );
      expect(page.items[0]).not.toHaveProperty('ownerId');
    });

    it('passes a decoded cursor on and ends without one', async () => {
      const cursor = {
        createdAt: new Date('2026-10-12T00:00:00Z'),
        id: '33333333-3333-4333-8333-333333333339',
      };
      repository.findPageForOwner.mockResolvedValue([makeNotification()]);

      const page = await service.findMine(
        ownerId,
        query({ cursor: encodeKeysetCursor(cursor) }),
      );

      expect(repository.findPageForOwner).toHaveBeenCalledWith(
        ownerId,
        21,
        cursor,
      );
      expect(page).toEqual(
        expect.objectContaining({ hasMore: false, nextCursor: null }),
      );
    });

    it('is a 400 for a cursor it did not issue', async () => {
      await expect(
        service.findMine(ownerId, query({ cursor: 'not-a-cursor' })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findPageForOwner).not.toHaveBeenCalled();
    });
  });

  it('counts unread notifications', async () => {
    repository.countUnread.mockResolvedValue(4);
    await expect(service.countUnread(ownerId)).resolves.toEqual({ count: 4 });
  });

  describe('markRead', () => {
    it('returns the notification it marked', async () => {
      repository.markRead.mockResolvedValue(makeNotification({ isRead: true }));

      await expect(
        service.markRead(ownerId, '33333333-3333-3333-3333-333333333333'),
      ).resolves.toEqual(expect.objectContaining({ isRead: true }));
      expect(repository.markRead).toHaveBeenCalledWith(
        '33333333-3333-3333-3333-333333333333',
        ownerId,
      );
    });

    it("is a 404 for someone else's notification", async () => {
      repository.markRead.mockResolvedValue(undefined);
      await expect(
        service.markRead(ownerId, '33333333-3333-3333-3333-333333333333'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('reports how many notifications mark-all-read changed', async () => {
    repository.markAllRead.mockResolvedValue(3);
    await expect(service.markAllRead(ownerId)).resolves.toEqual({ count: 3 });
  });

  describe('notify', () => {
    it('adds an ordinary notification in both languages', async () => {
      const input = {
        ownerId,
        type: 'BOOKING_RECEIVED' as const,
        title: 'มีการจองใหม่',
        en: { title: 'You have a new booking' },
      };
      repository.createWithTranslations.mockResolvedValue(
        makeNotification({ type: 'BOOKING_RECEIVED' }),
      );

      await service.notify(input);

      expect(repository.createWithTranslations).toHaveBeenCalledWith(input);
      expect(repository.upsertUnreadMessage).not.toHaveBeenCalled();
    });

    it('collapses chat messages into one notification per room', async () => {
      const input = {
        ownerId,
        type: 'NEW_MESSAGE' as const,
        title: 'ข้อความใหม่จาก อารยา ส.',
        content: 'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
        en: {
          title: 'New message from อารยา ส.',
          content: 'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
        },
        resourceId: roomId,
      };
      repository.upsertUnreadMessage.mockResolvedValue(
        makeNotification({ type: 'NEW_MESSAGE', resourceId: roomId }),
      );

      await service.notify(input);

      expect(repository.upsertUnreadMessage).toHaveBeenCalledWith(input);
      expect(repository.createWithTranslations).not.toHaveBeenCalled();
    });

    it('pushes the new notification to the owner with the page it opens', async () => {
      repository.createWithTranslations.mockResolvedValue(
        makeNotification({
          type: 'BOOKING_CONFIRMED',
          title: 'จองสำเร็จ',
          content: 'พรุ่งนี้ 10:00',
          resourceId: '44444444-4444-4444-4444-444444444444',
        }),
      );

      await service.notify({
        ownerId,
        type: 'BOOKING_CONFIRMED',
        title: 'จองสำเร็จ',
        content: 'พรุ่งนี้ 10:00',
        en: { title: 'Booking confirmed', content: 'Tomorrow 10:00' },
        resourceId: '44444444-4444-4444-4444-444444444444',
      });

      expect(push.sendToUser).toHaveBeenCalledWith(ownerId, {
        title: 'จองสำเร็จ',
        body: 'พรุ่งนี้ 10:00',
        url: '/bookings',
        tag: 'BOOKING_CONFIRMED:44444444-4444-4444-4444-444444444444',
      });
    });

    it('pushes in Thai even when the notification came back in English', async () => {
      // The row is in the language of the request that caused it, not the owner's.
      repository.createWithTranslations.mockResolvedValue(
        makeNotification({
          type: 'BOOKING_CONFIRMED',
          title: 'Booking confirmed',
          content: 'Tomorrow 10:00',
        }),
      );

      const result = await service.notify({
        ownerId,
        type: 'BOOKING_CONFIRMED',
        title: 'จองสำเร็จ',
        content: 'พรุ่งนี้ 10:00',
        en: { title: 'Booking confirmed', content: 'Tomorrow 10:00' },
      });

      expect(result.title).toBe('Booking confirmed');
      expect(push.sendToUser).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ title: 'จองสำเร็จ', body: 'พรุ่งนี้ 10:00' }),
      );
    });

    it('adds a chat message without a room as a plain notification', async () => {
      repository.createWithTranslations.mockResolvedValue(
        makeNotification({ type: 'NEW_MESSAGE', resourceId: null }),
      );

      await service.notify({
        ownerId,
        type: 'NEW_MESSAGE',
        title: 'ข้อความใหม่',
        en: { title: 'New message' },
      });

      expect(repository.createWithTranslations).toHaveBeenCalled();
      expect(repository.upsertUnreadMessage).not.toHaveBeenCalled();
    });
  });

  describe('welcome', () => {
    it("writes the Advisee welcome in both languages, with no resource, and doesn't push it", async () => {
      repository.createWelcome.mockResolvedValue(
        makeNotification({
          type: 'WELCOME',
          title: 'ยินดีต้อนรับสู่ Advisory',
          content: 'เริ่มจากหาผู้เชี่ยวชาญที่ใช่สำหรับคำถามของคุณ',
          resourceId: null,
        }),
      );

      const result = await service.welcome(ownerId);

      expect(repository.createWelcome).toHaveBeenCalledWith({
        ownerId,
        type: 'WELCOME',
        title: 'ยินดีต้อนรับสู่ Advisory',
        content: 'เริ่มจากหาผู้เชี่ยวชาญที่ใช่สำหรับคำถามของคุณ',
        en: {
          title: 'Welcome to Advisory',
          content: 'Start by finding the right expert for your question',
        },
      });
      expect(result).toEqual(
        expect.objectContaining({ type: 'WELCOME', resourceId: null }),
      );
      expect(result).not.toHaveProperty('ownerId');
      expect(push.sendToUser).not.toHaveBeenCalled();
    });

    it('is undefined for an account that already has its welcome', async () => {
      repository.createWelcome.mockResolvedValue(undefined);

      await expect(service.welcome(ownerId)).resolves.toBeUndefined();
      expect(push.sendToUser).not.toHaveBeenCalled();
    });
  });
});
