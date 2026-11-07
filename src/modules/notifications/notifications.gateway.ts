import { Inject } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Auth } from '@/modules/auth/auth.config';
import {
  NOTIFICATION_MESSAGES,
  NOTIFICATIONS_NAMESPACE,
  notificationSocketRoom,
} from './notifications.constants';
import { NotificationsRealtime } from './notifications-realtime';
import type {
  NotificationServer,
  NotificationSocket,
} from './notifications-socket.types';

/**
 * The `/notifications` namespace. A connection signs in with the same session
 * cookie as every REST call and joins its user's room; the server only ever
 * sends `notification:new` there (see `NotificationsRealtime`). Clients send
 * nothing.
 */
@WebSocketGateway({ namespace: NOTIFICATIONS_NAMESPACE })
export class NotificationsGateway
  implements
    OnGatewayInit<NotificationServer>,
    OnGatewayConnection<NotificationSocket>
{
  constructor(
    @Inject(AuthService) private readonly auth: Auth,
    private readonly realtime: NotificationsRealtime,
  ) {}

  afterInit(server: NotificationServer): void {
    this.realtime.attach(server);
    server.use((client, next) => {
      void this.signIn(client, next);
    });
  }

  handleConnection(client: NotificationSocket): void {
    const { userId } = client.data;
    if (userId) void client.join(notificationSocketRoom(userId));
  }

  /** Refuses the connection unless the cookie belongs to an active account. */
  async signIn(
    client: NotificationSocket,
    next: (error?: Error) => void,
  ): Promise<void> {
    try {
      const session = await this.auth.api.getSession({
        headers: fromNodeHeaders(client.handshake.headers),
      });
      if (!session || session.user.status !== 'ACTIVE') {
        next(new Error(NOTIFICATION_MESSAGES.socketUnauthorized));
        return;
      }
      client.data.userId = session.user.id;
      next();
    } catch {
      next(new Error(NOTIFICATION_MESSAGES.socketUnauthorized));
    }
  }
}
