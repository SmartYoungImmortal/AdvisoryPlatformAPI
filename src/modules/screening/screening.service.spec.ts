import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ScreeningRequestQueryDto } from './dtos/screening-request-query.dto';
import { SCREENING_NOTIFICATIONS } from './screening.constants';
import type { ScreeningRepository } from './screening.repository';
import { ScreeningService } from './screening.service';
import type {
  AdvisorScreeningRequestRow,
  ScreeningQuestion,
  ScreeningRequest,
  ScreeningService as ScreenedService,
} from './screening.types';

const advisor = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Araya',
} as SessionUser;
const advisee = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Nattapong',
} as SessionUser;
const serviceId = '33333333-3333-3333-3333-333333333333';
const requestId = '44444444-4444-4444-4444-444444444444';
const q1 = '55555555-5555-5555-5555-555555555551';
const q2 = '55555555-5555-5555-5555-555555555552';
const createdAt = new Date('2026-10-01T00:00:00Z');

const service: ScreenedService = {
  id: serviceId,
  name: 'ที่ปรึกษาโปรเจกต์จบ',
  advisorId: advisor.id,
  screeningRequired: true,
};

function makeQuestion(
  id: string,
  overrides: Partial<ScreeningQuestion> = {},
): ScreeningQuestion {
  return {
    id,
    serviceId,
    question: `Question ${id.slice(-1)}`,
    isRequired: true,
    displayOrder: Number(id.slice(-1)) - 1,
    createdAt,
    deletedAt: null,
    ...overrides,
  };
}

function makeRequest(
  overrides: Partial<ScreeningRequest> = {},
): ScreeningRequest {
  return {
    id: requestId,
    serviceId,
    adviseeId: advisee.id,
    status: 'PENDING',
    decisionReason: null,
    createdAt,
    decidedAt: null,
    viewedAt: null,
    ...overrides,
  };
}

function makeRow(
  overrides: Partial<AdvisorScreeningRequestRow> = {},
): AdvisorScreeningRequestRow {
  return {
    id: requestId,
    serviceId,
    serviceName: service.name,
    adviseeId: advisee.id,
    adviseeDisplayName: 'ณัฐพงษ์ ส.',
    status: 'PENDING',
    decisionReason: null,
    createdAt,
    decidedAt: null,
    viewedAt: null,
    ...overrides,
  };
}

describe('ScreeningService', () => {
  let service_: ScreeningService;
  let repository: jest.Mocked<
    Pick<
      ScreeningRepository,
      | 'findOwnedService'
      | 'findPublishedService'
      | 'findActiveQuestions'
      | 'replaceQuestions'
      | 'findLatestForAdvisee'
      | 'findDisplayName'
      | 'createWithAnswers'
      | 'findManyForAdvisor'
      | 'countForAdvisor'
      | 'findOneForAdvisor'
      | 'findAnswers'
      | 'markViewed'
      | 'decidePending'
    >
  >;

  beforeEach(() => {
    repository = {
      findOwnedService: jest.fn(),
      findPublishedService: jest.fn(),
      findActiveQuestions: jest.fn(),
      replaceQuestions: jest.fn(),
      findLatestForAdvisee: jest.fn(),
      findDisplayName: jest.fn(),
      createWithAnswers: jest.fn(),
      findManyForAdvisor: jest.fn(),
      countForAdvisor: jest.fn(),
      findOneForAdvisor: jest.fn(),
      findAnswers: jest.fn(),
      markViewed: jest.fn(),
      decidePending: jest.fn(),
    };
    service_ = new ScreeningService(
      repository as unknown as ScreeningRepository,
    );
  });

  describe('questions', () => {
    it('lists the active questions of a service the advisor owns', async () => {
      repository.findOwnedService.mockResolvedValue(service);
      repository.findActiveQuestions.mockResolvedValue([makeQuestion(q1)]);

      await expect(service_.findQuestions(advisor, serviceId)).resolves.toEqual(
        [expect.objectContaining({ id: q1, isRequired: true })],
      );
      expect(repository.findOwnedService).toHaveBeenCalledWith(
        serviceId,
        advisor.id,
      );
    });

    it('refuses another advisor’s service with a 404', async () => {
      repository.findOwnedService.mockResolvedValue(undefined);

      await expect(
        service_.replaceQuestions(advisor, serviceId, {
          questions: [{ question: 'Why?', isRequired: true }],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.replaceQuestions).not.toHaveBeenCalled();
    });

    it('replaces the list in the order given', async () => {
      repository.findOwnedService.mockResolvedValue(service);
      repository.replaceQuestions.mockResolvedValue([
        makeQuestion(q1),
        makeQuestion(q2, { isRequired: false }),
      ]);

      const result = await service_.replaceQuestions(advisor, serviceId, {
        questions: [
          { question: 'First', isRequired: true },
          { question: 'Second', isRequired: false },
        ],
      });

      expect(repository.replaceQuestions).toHaveBeenCalledWith(serviceId, [
        { question: 'First', isRequired: true },
        { question: 'Second', isRequired: false },
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('advisee reads a service', () => {
    it('returns the questions and the latest own request', async () => {
      repository.findPublishedService.mockResolvedValue(service);
      repository.findActiveQuestions.mockResolvedValue([makeQuestion(q1)]);
      repository.findLatestForAdvisee.mockResolvedValue(
        makeRequest({ status: 'DECLINED', decisionReason: 'Full this month' }),
      );

      const result = await service_.findForService(advisee, serviceId);

      expect(result.screeningRequired).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(result.request).toEqual(
        expect.objectContaining({
          status: 'DECLINED',
          decisionReason: 'Full this month',
        }),
      );
    });

    it('returns no questions for a service that does not screen', async () => {
      repository.findPublishedService.mockResolvedValue({
        ...service,
        screeningRequired: false,
      });
      repository.findLatestForAdvisee.mockResolvedValue(undefined);

      const result = await service_.findForService(advisee, serviceId);

      expect(result.questions).toEqual([]);
      expect(result.request).toBeNull();
      expect(repository.findActiveQuestions).not.toHaveBeenCalled();
    });

    it('is a 404 for an unpublished service', async () => {
      repository.findPublishedService.mockResolvedValue(undefined);

      await expect(service_.findForService(advisee, serviceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submit', () => {
    beforeEach(() => {
      repository.findPublishedService.mockResolvedValue(service);
      repository.findLatestForAdvisee.mockResolvedValue(undefined);
      repository.findActiveQuestions.mockResolvedValue([
        makeQuestion(q1),
        makeQuestion(q2, { isRequired: false }),
      ]);
      repository.findDisplayName.mockResolvedValue('ณัฐพงษ์ ส.');
      repository.createWithAnswers.mockResolvedValue(makeRequest());
    });

    it('stores answers with the question wording and notifies the advisor', async () => {
      await expect(
        service_.submit(advisee, serviceId, {
          answers: [{ questionId: q1, answer: 'A booking system' }],
        }),
      ).resolves.toEqual(expect.objectContaining({ status: 'PENDING' }));

      expect(repository.createWithAnswers).toHaveBeenCalledWith(
        { serviceId, adviseeId: advisee.id },
        [
          {
            questionId: q1,
            questionText: 'Question 1',
            answer: 'A booking system',
          },
        ],
        {
          ownerId: advisor.id,
          type: 'SCREENING_REQUESTED',
          title: SCREENING_NOTIFICATIONS.requestedTitle,
          content: SCREENING_NOTIFICATIONS.requestedContent(
            'ณัฐพงษ์ ส.',
            service.name,
          ),
        },
      );
    });

    it('allows applying again after a decline', async () => {
      repository.findLatestForAdvisee.mockResolvedValue(
        makeRequest({ status: 'DECLINED' }),
      );

      await expect(
        service_.submit(advisee, serviceId, {
          answers: [{ questionId: q1, answer: 'Again' }],
        }),
      ).resolves.toBeDefined();
    });

    it.each([['PENDING' as const], ['ACCEPTED' as const]])(
      'refuses while the latest request is %s',
      async (status) => {
        repository.findLatestForAdvisee.mockResolvedValue(
          makeRequest({ status }),
        );

        await expect(
          service_.submit(advisee, serviceId, {
            answers: [{ questionId: q1, answer: 'x' }],
          }),
        ).rejects.toThrow(ConflictException);
        expect(repository.createWithAnswers).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['a required question is missing', [{ questionId: q2, answer: 'x' }]],
      [
        'a question is answered twice',
        [
          { questionId: q1, answer: 'x' },
          { questionId: q1, answer: 'y' },
        ],
      ],
      [
        'an answer names a question that was not asked',
        [
          { questionId: q1, answer: 'x' },
          { questionId: requestId, answer: 'y' },
        ],
      ],
    ])('is a 400 when %s', async (_case, answers) => {
      await expect(
        service_.submit(advisee, serviceId, { answers }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createWithAnswers).not.toHaveBeenCalled();
    });

    it('refuses a service that does not screen, the advisor’s own service, and one with no questions', async () => {
      repository.findPublishedService.mockResolvedValueOnce({
        ...service,
        screeningRequired: false,
      });
      await expect(
        service_.submit(advisee, serviceId, { answers: [] }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service_.submit(advisor, serviceId, { answers: [] }),
      ).rejects.toThrow(BadRequestException);

      repository.findActiveQuestions.mockResolvedValueOnce([]);
      await expect(
        service_.submit(advisee, serviceId, { answers: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('is a 404 for an unpublished service', async () => {
      repository.findPublishedService.mockResolvedValue(undefined);

      await expect(
        service_.submit(advisee, serviceId, { answers: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('turns a lost race on the pending-request index into a 409', async () => {
      repository.createWithAnswers.mockRejectedValue({
        cause: { code: '23505' },
      });

      await expect(
        service_.submit(advisee, serviceId, {
          answers: [{ questionId: q1, answer: 'x' }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows any other database error', async () => {
      repository.createWithAnswers.mockRejectedValue(new Error('down'));

      await expect(
        service_.submit(advisee, serviceId, {
          answers: [{ questionId: q1, answer: 'x' }],
        }),
      ).rejects.toThrow('down');
    });
  });

  describe('advisor requests', () => {
    it('lists the advisor’s requests filtered by status', async () => {
      repository.findManyForAdvisor.mockResolvedValue([makeRow()]);
      repository.countForAdvisor.mockResolvedValue(1);
      const query = Object.assign(new ScreeningRequestQueryDto(), {
        status: 'PENDING' as const,
      });

      const result = await service_.findRequests(advisor, query);

      expect(result.total).toBe(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({ serviceName: service.name }),
      );
      expect(repository.countForAdvisor).toHaveBeenCalledWith(
        advisor.id,
        'PENDING',
      );
    });

    it('marks a request viewed the first time it is opened', async () => {
      const viewedAt = new Date('2026-10-02T00:00:00Z');
      repository.findOneForAdvisor.mockResolvedValue(makeRow());
      repository.markViewed.mockResolvedValue(viewedAt);
      repository.findAnswers.mockResolvedValue([
        { questionId: q1, questionText: 'Question 1', answer: 'x' },
      ]);

      const result = await service_.findRequest(advisor, requestId);

      expect(result.viewedAt).toBe(viewedAt);
      expect(result.answers).toHaveLength(1);
    });

    it('does not re-stamp a request already viewed', async () => {
      const viewedAt = new Date('2026-10-01T12:00:00Z');
      repository.findOneForAdvisor.mockResolvedValue(makeRow({ viewedAt }));
      repository.findAnswers.mockResolvedValue([]);

      const result = await service_.findRequest(advisor, requestId);

      expect(result.viewedAt).toBe(viewedAt);
      expect(repository.markViewed).not.toHaveBeenCalled();
    });

    it('is a 404 for a request on another advisor’s service', async () => {
      repository.findOneForAdvisor.mockResolvedValue(undefined);

      await expect(service_.findRequest(advisor, requestId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('decisions', () => {
    it('accepts and notifies the advisee', async () => {
      repository.findOneForAdvisor.mockResolvedValue(makeRow());
      repository.decidePending.mockResolvedValue(
        makeRequest({ status: 'ACCEPTED', decidedAt: createdAt }),
      );

      await expect(service_.accept(advisor, requestId)).resolves.toEqual(
        expect.objectContaining({ status: 'ACCEPTED' }),
      );
      expect(repository.decidePending).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({ status: 'ACCEPTED', decisionReason: null }),
        {
          ownerId: advisee.id,
          type: 'SCREENING_DECIDED',
          title: SCREENING_NOTIFICATIONS.acceptedTitle,
          content: service.name,
        },
      );
    });

    it('declines with the optional message, and without one', async () => {
      repository.findOneForAdvisor.mockResolvedValue(makeRow());
      repository.decidePending.mockResolvedValue(
        makeRequest({ status: 'DECLINED' }),
      );

      await service_.decline(advisor, requestId, {
        message: 'Full this month',
      });
      expect(repository.decidePending).toHaveBeenLastCalledWith(
        requestId,
        expect.objectContaining({
          status: 'DECLINED',
          decisionReason: 'Full this month',
        }),
        expect.objectContaining({
          title: SCREENING_NOTIFICATIONS.declinedTitle,
        }),
      );

      await service_.decline(advisor, requestId, {});
      expect(repository.decidePending).toHaveBeenLastCalledWith(
        requestId,
        expect.objectContaining({ decisionReason: null }),
        expect.anything(),
      );
    });

    it('is a 409 for a request already decided', async () => {
      repository.findOneForAdvisor.mockResolvedValue(
        makeRow({ status: 'ACCEPTED' }),
      );

      await expect(service_.accept(advisor, requestId)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.decidePending).not.toHaveBeenCalled();
    });

    it('is a 409 when another decision lands between the read and the write', async () => {
      repository.findOneForAdvisor.mockResolvedValue(makeRow());
      repository.decidePending.mockResolvedValue(undefined);

      await expect(service_.accept(advisor, requestId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
