import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import { Environment } from '@/config/environment.enum';
import { MEETING } from '@/modules/bookings/bookings.constants';
import {
  SESSION_REMINDER_NOTIFICATION,
  SESSION_REMINDER_SWEEP_MS,
} from './notifications.constants';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

/**
 * Sends both people a "session starts soon" notification shortly before each booked session: as
 * far ahead as its video call opens (`MEETING.opensMinutesBefore`), so the reminder can be acted on.
 *
 * It checks every minute while the API is running. On Cloud Run an idle instance is stopped, so a
 * reminder can be late until a request wakes the API; calling `sendDue()` from a scheduler would
 * fix that.
 */
@Injectable()
export class SessionRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionRemindersService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    // Tests call `sendDue()` themselves.
    if (this.config.get(ENV_KEYS.NODE_ENV) === Environment.Test) return;
    this.timer = setInterval(
      () => void this.sendDue(),
      SESSION_REMINDER_SWEEP_MS,
    );
    // A waiting check must never keep the process alive on shutdown.
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  /** Reminds every session that is now due, once each. Returns how many sessions were reminded. */
  async sendDue(now = new Date()): Promise<number> {
    try {
      const startsBy = new Date(
        now.getTime() + MEETING.opensMinutesBefore * 60_000,
      );
      const due = await this.repository.claimDueReminders(now, startsBy);
      if (due.length === 0) return 0;
      const names = await this.repository.findServiceNames([
        ...new Set(due.map((session) => session.serviceId)),
      ]);
      await Promise.all(
        due.flatMap((session) => {
          const name = names.get(session.serviceId);
          const when = (locale: string) => {
            const time = new Intl.DateTimeFormat(locale, {
              timeStyle: 'short',
              timeZone: 'Asia/Bangkok',
            }).format(session.startTime);
            return name ? `${name} · ${time}` : time;
          };
          return [session.adviseeId, session.advisorId].map((ownerId) =>
            this.notifications.notify({
              ownerId,
              type: 'SESSION_REMINDER',
              title: SESSION_REMINDER_NOTIFICATION.title,
              content: when('th-TH'),
              en: {
                title: SESSION_REMINDER_NOTIFICATION.en.title,
                content: when('en-GB'),
              },
              resourceId: session.bookingId,
            }),
          );
        }),
      );
      return due.length;
    } catch (error: unknown) {
      // A failed check must not stop the next one.
      this.logger.warn(
        `Session reminders failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}
