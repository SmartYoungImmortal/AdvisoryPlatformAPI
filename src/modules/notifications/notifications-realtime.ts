import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_EVENTS,
  notificationSocketRoom,
} from './notifications.constants';
import type { NotificationServer } from './notifications-socket.types';

/**
 * Tells a user's open apps, over Socket.IO, that a notification has arrived. The
 * gateway hands over its server when it starts (`attach`), so this class needs no
 * other provider and `NotificationsService` can use it without a dependency cycle
 * (the auth module, which the gateway needs, itself depends on
 * `NotificationsService`).
 */
@Injectable()
export class NotificationsRealtime {
  private server?: NotificationServer;

  attach(server: NotificationServer): void {
    this.server = server;
  }

  /**
   * Sends no text: the notification is stored in Thai and English, and each app
   * reads it from the API in its own language. Does nothing before the gateway
   * has started.
   */
  announce(ownerId: string): void {
    this.server
      ?.to(notificationSocketRoom(ownerId))
      .emit(NOTIFICATION_EVENTS.created);
  }
}
