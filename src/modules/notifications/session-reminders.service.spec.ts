import type { ConfigService } from '@nestjs/config';
import type { NotificationsRepository } from './notifications.repository';
import type { NotificationsService } from './notifications.service';
import { SessionRemindersService } from './session-reminders.service';

const now = new Date('2026-11-07T07:00:00Z');
const session = {
  bookingId: '44444444-4444-4444-4444-444444444444',
  serviceId: '33333333-3333-3333-3333-333333333333',
  advisorId: '22222222-2222-2222-2222-222222222222',
  adviseeId: '11111111-1111-1111-1111-111111111111',
  startTime: new Date('2026-11-07T07:08:00Z'),
};

describe('SessionRemindersService', () => {
  let repository: jest.Mocked<
    Pick<NotificationsRepository, 'claimDueReminders' | 'findServiceNames'>
  >;
  let notifications: jest.Mocked<Pick<NotificationsService, 'notify'>>;
  const make = (nodeEnv = 'test') =>
    new SessionRemindersService(
      repository as unknown as NotificationsRepository,
      notifications as unknown as NotificationsService,
      { get: () => nodeEnv } as unknown as ConfigService,
    );

  beforeEach(() => {
    repository = {
      claimDueReminders: jest.fn().mockResolvedValue([]),
      findServiceNames: jest.fn().mockResolvedValue(new Map()),
    };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };
  });

  it('claims what starts before the video call opens, and reminds both people', async () => {
    repository.claimDueReminders.mockResolvedValue([session]);
    repository.findServiceNames.mockResolvedValue(
      new Map([[session.serviceId, 'วางแผนภาษี']]),
    );

    await expect(make().sendDue(now)).resolves.toBe(1);

    expect(repository.claimDueReminders).toHaveBeenCalledWith(
      now,
      new Date('2026-11-07T07:10:00Z'),
    );
    expect(notifications.notify).toHaveBeenCalledTimes(2);
    for (const ownerId of [session.adviseeId, session.advisorId]) {
      expect(notifications.notify).toHaveBeenCalledWith({
        ownerId,
        type: 'SESSION_REMINDER',
        title: 'เซสชันใกล้เริ่มแล้ว',
        content: 'วางแผนภาษี · 14:08',
        en: {
          title: 'Your session starts soon',
          content: 'วางแผนภาษี · 14:08',
        },
        resourceId: session.bookingId,
      });
    }
  });

  it('sends nothing when no session is due', async () => {
    await expect(make().sendDue(now)).resolves.toBe(0);
    expect(repository.findServiceNames).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('swallows a failure so the next check still runs', async () => {
    repository.claimDueReminders.mockRejectedValue(new Error('database down'));
    await expect(make().sendDue(now)).resolves.toBe(0);
  });

  it('runs its own timer outside tests only', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    make('test').onModuleInit();
    expect(setIntervalSpy).not.toHaveBeenCalled();

    const running = make('development');
    running.onModuleInit();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    running.onModuleDestroy();
    setIntervalSpy.mockRestore();
  });
});
