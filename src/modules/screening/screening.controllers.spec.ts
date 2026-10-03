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

import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorScreeningController } from './advisor-screening.controller';
import { ScreeningRequestQueryDto } from './dtos/screening-request-query.dto';
import { ScreeningController } from './screening.controller';
import type { ScreeningService } from './screening.service';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const serviceId = '33333333-3333-3333-3333-333333333333';
const requestId = '44444444-4444-4444-4444-444444444444';

describe('Screening controllers', () => {
  let service: jest.Mocked<ScreeningService>;

  beforeEach(() => {
    service = {
      findQuestions: jest.fn(),
      replaceQuestions: jest.fn(),
      findRequests: jest.fn(),
      findRequest: jest.fn(),
      accept: jest.fn(),
      decline: jest.fn(),
      findForService: jest.fn(),
      submit: jest.fn(),
    } as unknown as jest.Mocked<ScreeningService>;
  });

  it('delegates every advisor route with the session user', () => {
    const controller = new AdvisorScreeningController(service);
    const questions = { questions: [{ question: 'Why?', isRequired: true }] };
    const query = new ScreeningRequestQueryDto();

    void controller.findQuestions(user, serviceId);
    void controller.replaceQuestions(user, serviceId, questions);
    void controller.findRequests(user, query);
    void controller.findRequest(user, requestId);
    void controller.accept(user, requestId);
    void controller.decline(user, requestId, { message: 'Full' });

    expect(service.findQuestions).toHaveBeenCalledWith(user, serviceId);
    expect(service.replaceQuestions).toHaveBeenCalledWith(
      user,
      serviceId,
      questions,
    );
    expect(service.findRequests).toHaveBeenCalledWith(user, query);
    expect(service.findRequest).toHaveBeenCalledWith(user, requestId);
    expect(service.accept).toHaveBeenCalledWith(user, requestId);
    expect(service.decline).toHaveBeenCalledWith(user, requestId, {
      message: 'Full',
    });
  });

  it('delegates the advisee routes with the session user', () => {
    const controller = new ScreeningController(service);
    const answers = {
      answers: [{ questionId: requestId, answer: 'A booking system' }],
    };

    void controller.findForService(user, serviceId);
    void controller.submit(user, serviceId, answers);

    expect(service.findForService).toHaveBeenCalledWith(user, serviceId);
    expect(service.submit).toHaveBeenCalledWith(user, serviceId, answers);
  });

  it.each([
    ['findQuestions', { permission: { advisor: ['read'] } }],
    ['replaceQuestions', { permission: { advisor: ['updateSelf'] } }],
    ['findRequests', { permission: { advisor: ['read'] } }],
    ['findRequest', { permission: { advisor: ['read'] } }],
    ['accept', { permission: { advisor: ['updateSelf'] } }],
    ['decline', { permission: { advisor: ['updateSelf'] } }],
  ] as const)('guards advisor %s', (method, expected) => {
    const handler = AdvisorScreeningController.prototype[method];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      expected,
    );
  });
});
