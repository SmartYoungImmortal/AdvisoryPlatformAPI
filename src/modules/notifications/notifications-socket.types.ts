import type { Server, Socket } from 'socket.io';

/** What the server sends on the `/notifications` namespace. Clients send nothing. */
export interface NotificationServerEvents {
  'notification:new': () => void;
}

/** What a connection keeps after it has signed in. */
export interface NotificationSocketData {
  userId?: string;
}

type NoEvents = Record<string, never>;

export type NotificationServer = Server<
  NoEvents,
  NotificationServerEvents,
  NoEvents,
  NotificationSocketData
>;

export type NotificationSocket = Socket<
  NoEvents,
  NotificationServerEvents,
  NoEvents,
  NotificationSocketData
>;
