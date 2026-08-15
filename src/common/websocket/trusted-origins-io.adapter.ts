import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

/** Keeps HTTP CORS and Socket.IO handshakes on the same trusted-origin allowlist. */
export class TrustedOriginsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly trustedOrigins: readonly string[],
  ) {
    super(app);
  }

  override createIOServer(
    port: number,
    options?: Partial<ServerOptions>,
  ): unknown {
    return super.createIOServer(port, {
      ...options,
      cors: {
        ...options?.cors,
        origin: [...this.trustedOrigins],
        credentials: true,
      },
    });
  }
}
