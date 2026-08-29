import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Socket } from 'socket.io';
import type { Auth, SessionUser } from '@/modules/auth/auth.config';
import { CHAT_MESSAGES } from './chat.constants';
import type {
  ChatClientToServerEvents,
  ChatInterServerEvents,
  ChatServerToClientEvents,
  ChatSocketData,
} from './chat-socket.types';
import { AuthService } from '@thallesp/nestjs-better-auth';

export type ChatSocket = Socket<
  ChatClientToServerEvents,
  ChatServerToClientEvents,
  ChatInterServerEvents,
  ChatSocketData
>;

@Injectable()
export class ChatSocketSessionService {
  constructor(@Inject(AuthService) private readonly auth: Auth) {}

  async authenticate(client: ChatSocket): Promise<SessionUser> {
    const authSession = await this.auth.api.getSession({
      headers: fromNodeHeaders(client.handshake.headers),
    });

    if (!authSession) {
      throw new UnauthorizedException(CHAT_MESSAGES.authenticationRequired);
    }
    if (authSession.user.status !== 'ACTIVE') {
      throw new ForbiddenException(CHAT_MESSAGES.inactiveAccount);
    }

    client.data.user = authSession.user;
    client.data.session = authSession.session;
    return authSession.user;
  }
}
