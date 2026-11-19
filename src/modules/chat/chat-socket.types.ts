import type { AuthSession, SessionUser } from '@/modules/auth/auth.config';
import type { ChatMessageResponseDto } from './dtos/chat-message-response.dto';
import type { ChatReadResponseDto } from './dtos/chat-read-response.dto';
import type { ChatRoomEventDto } from './dtos/chat-room-event.dto';
import type { MarkChatReadEventDto } from './dtos/mark-chat-read.dto';
import type { SendChatMessageDto } from './dtos/send-chat-message.dto';
import type { TrialRequestResponseDto } from '@/modules/trials/dtos/trial-request-response.dto';

export interface ChatSocketData {
  user?: SessionUser;
  session?: AuthSession['session'];
}

export interface ChatSocketError {
  statusCode: number;
  message: string;
}

export type ChatAck<T> = (result: T) => void;

export interface ChatClientToServerEvents {
  'chat:join': (
    payload: ChatRoomEventDto,
    acknowledge?: ChatAck<ChatRoomEventDto>,
  ) => void;
  'chat:leave': (
    payload: ChatRoomEventDto,
    acknowledge?: ChatAck<ChatRoomEventDto>,
  ) => void;
  'chat:send': (
    payload: SendChatMessageDto,
    acknowledge?: ChatAck<ChatMessageResponseDto>,
  ) => void;
  'chat:read': (
    payload: MarkChatReadEventDto,
    acknowledge?: ChatAck<ChatReadResponseDto>,
  ) => void;
}

export interface ChatServerToClientEvents {
  'chat:message': (payload: ChatMessageResponseDto) => void;
  'chat:read': (payload: ChatReadResponseDto) => void;
  /** A free-trial request card in the room was sent, granted or declined. */
  'chat:trial': (payload: TrialRequestResponseDto) => void;
  exception: (payload: ChatSocketError) => void;
}

export type ChatInterServerEvents = Record<never, never>;
