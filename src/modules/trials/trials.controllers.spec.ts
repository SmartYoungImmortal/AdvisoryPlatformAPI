jest.mock('@thallesp/nestjs-better-auth', () => ({
  UserHasPermission:
    (options: unknown) =>
    (_target: object, _key: string, descriptor: PropertyDescriptor) => {
      const handler: unknown = descriptor.value;
      if (typeof handler === 'function') {
        Reflect.defineMetadata('USER_HAS_PERMISSION', options, handler);
      }
    },
}));
// The real gateway loads better-auth, which Jest cannot parse; the controllers never reach it.
jest.mock('@/modules/chat/chat.gateway', () => ({
  ChatGateway: class ChatGateway {},
}));

import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorTrialsController } from './advisor-trials.controller';
import { ChatTrialsController } from './chat-trials.controller';
import { TrialsController } from './trials.controller';
import type { TrialsService } from './trials.service';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const serviceId = '33333333-3333-3333-3333-333333333333';
const requestId = '44444444-4444-4444-4444-444444444444';
const chatRoomId = '66666666-6666-6666-6666-666666666666';

describe('Trial controllers', () => {
  let service: jest.Mocked<TrialsService>;

  beforeEach(() => {
    service = {
      findForService: jest.fn(),
      request: jest.fn(),
      findForRoom: jest.fn(),
      grant: jest.fn(),
      decline: jest.fn(),
    } as unknown as jest.Mocked<TrialsService>;
  });

  it('delegates the advisee routes with the session user', () => {
    const controller = new TrialsController(service);

    void controller.findForService(user, serviceId);
    void controller.request(user, serviceId);

    expect(service.findForService).toHaveBeenCalledWith(user, serviceId);
    expect(service.request).toHaveBeenCalledWith(user, serviceId);
  });

  it('delegates the chat room route', () => {
    void new ChatTrialsController(service).findForRoom(user, chatRoomId);

    expect(service.findForRoom).toHaveBeenCalledWith(user, chatRoomId);
  });

  it('delegates the advisor decisions and asks for the advisor permission', () => {
    const controller = new AdvisorTrialsController(service);

    void controller.grant(user, requestId);
    void controller.decline(user, requestId, { message: 'Full' });

    expect(service.grant).toHaveBeenCalledWith(user, requestId);
    expect(service.decline).toHaveBeenCalledWith(user, requestId, {
      message: 'Full',
    });
    for (const handler of [controller.grant, controller.decline]) {
      expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual({
        permission: { advisor: ['updateSelf'] },
      });
    }
  });
});
