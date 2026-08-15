export const CHAT_EVENTS = {
  join: 'chat:join',
  leave: 'chat:leave',
  send: 'chat:send',
  message: 'chat:message',
  markRead: 'chat:read',
  read: 'chat:read',
} as const;

export const CHAT_MESSAGES = {
  roomNotFound: 'Chat room not found',
  messageNotFound: 'Chat message not found',
  invalidCursor: 'Invalid chat message cursor',
  messagesFound: 'Chat messages found',
  roomsFound: 'Chat rooms found',
  readUpdated: 'Chat read state updated',
  authenticationRequired: 'Socket authentication required',
  inactiveAccount: 'Socket connection requires an active account',
  internalError: 'Unable to process chat event',
} as const;

export const CHAT_MESSAGE_MAX_LENGTH = 4_000;
export const CHAT_NAMESPACE = '/chat';

export function chatSocketRoom(chatRoomId: string): string {
  return `chat:${chatRoomId}`;
}
