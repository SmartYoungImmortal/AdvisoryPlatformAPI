import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { ChatGateway } from '@/modules/chat/chat.gateway';
import type { NotificationsService } from '@/modules/notifications/notifications.service';
import { TRIAL_NOTIFICATIONS } from './trials.constants';
import type { TrialsRepository } from './trials.repository';
import { TrialsService } from './trials.service';
import type {
  TrialRequest,
  TrialRequestRow,
  TrialService,
} from './trials.types';

// The real gateway loads better-auth, which Jest cannot parse; the tests use their own stand-in.
jest.mock('@/modules/chat/chat.gateway', () => ({
  ChatGateway: class ChatGateway {},
}));

const advisor = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Kanya',
} as SessionUser;
const advisee = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Nattapong',
} as SessionUser;
const serviceId = '33333333-3333-3333-3333-333333333333';
const requestId = '44444444-4444-4444-4444-444444444444';
const chatRoomId = '66666666-6666-6666-6666-666666666666';
const createdAt = new Date('2026-11-18T00:00:00Z');

const service: TrialService = {
  id: serviceId,
  name: 'วางแผนภาษี',
  advisorId: advisor.id,
  trialEnabled: true,
  trialDurationMinutes: 15,
};

function makeRequest(overrides: Partial<TrialRequest> = {}): TrialRequest {
  return {
    id: requestId,
    serviceId,
    adviseeId: advisee.id,
    chatRoomId,
    status: 'PENDING',
    decisionReason: null,
    createdAt,
    decidedAt: null,
    ...overrides,
  };
}

function makeRow(overrides: Partial<TrialRequestRow> = {}): TrialRequestRow {
  return {
    ...makeRequest(),
    serviceName: service.name,
    advisorId: advisor.id,
    trialDurationMinutes: 15,
    trialBookingId: null,
    ...overrides,
  };
}

describe('TrialsService', () => {
  let trials: TrialsService;
  let notifications: jest.Mocked<Pick<NotificationsService, 'notify'>>;
  let chat: jest.Mocked<Pick<ChatGateway, 'announceTrial'>>;
  let repository: jest.Mocked<
    Pick<
      TrialsRepository,
      | 'findPublishedService'
      | 'findServiceNames'
      | 'findDisplayName'
      | 'findForAdvisee'
      | 'isRoomMember'
      | 'findForRoom'
      | 'findOneForAdvisor'
      | 'createWithRoom'
      | 'decidePending'
    >
  >;

  beforeEach(() => {
    repository = {
      findPublishedService: jest.fn(),
      findServiceNames: jest.fn(),
      findDisplayName: jest.fn(),
      findForAdvisee: jest.fn(),
      isRoomMember: jest.fn(),
      findForRoom: jest.fn(),
      findOneForAdvisor: jest.fn(),
      createWithRoom: jest.fn(),
      decidePending: jest.fn(),
    };
    notifications = { notify: jest.fn() };
    chat = { announceTrial: jest.fn() };
    trials = new TrialsService(
      repository as unknown as TrialsRepository,
      notifications as unknown as NotificationsService,
      chat as unknown as ChatGateway,
    );
  });

  describe('findForService', () => {
    it('says whether the service offers a trial, with the caller’s request', async () => {
      repository.findPublishedService.mockResolvedValue(service);
      repository.findForAdvisee.mockResolvedValue(makeRow());

      const trial = await trials.findForService(advisee, serviceId);

      expect(trial).toEqual(
        expect.objectContaining({
          serviceId,
          trialEnabled: true,
          trialDurationMinutes: 15,
        }),
      );
      expect(trial.request).toEqual(
        expect.objectContaining({ id: requestId, chatRoomId }),
      );
      expect(repository.findForAdvisee).toHaveBeenCalledWith(
        serviceId,
        advisee.id,
      );
    });

    it('has no request before the advisee asks', async () => {
      repository.findPublishedService.mockResolvedValue(service);
      repository.findForAdvisee.mockResolvedValue(undefined);

      await expect(trials.findForService(advisee, serviceId)).resolves.toEqual(
        expect.objectContaining({ request: null }),
      );
    });

    it('refuses a service that is not published with a 404', async () => {
      repository.findPublishedService.mockResolvedValue(undefined);

      await expect(trials.findForService(advisee, serviceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('request', () => {
    beforeEach(() => {
      repository.findPublishedService.mockResolvedValue(service);
      repository.findForAdvisee.mockResolvedValue(undefined);
      repository.createWithRoom.mockResolvedValue(makeRequest());
      repository.findDisplayName.mockResolvedValue('ณัฐพงษ์ ด.');
      repository.findServiceNames.mockResolvedValue({
        th: 'วางแผนภาษี',
        en: 'Tax planning',
      });
    });

    it('saves the ask in the room and tells the advisor, in both languages', async () => {
      await expect(trials.request(advisee, serviceId)).resolves.toEqual(
        expect.objectContaining({
          id: requestId,
          chatRoomId,
          status: 'PENDING',
          advisorId: advisor.id,
          trialDurationMinutes: 15,
        }),
      );
      expect(repository.createWithRoom).toHaveBeenCalledWith({
        serviceId,
        adviseeId: advisee.id,
        advisorId: advisor.id,
      });
      expect(notifications.notify).toHaveBeenCalledWith({
        ownerId: advisor.id,
        type: 'TRIAL_REQUESTED',
        title: TRIAL_NOTIFICATIONS.requestedTitle,
        content: 'ณัฐพงษ์ ด. ขอทดลองฟรี 15 นาที · วางแผนภาษี',
        en: {
          title: TRIAL_NOTIFICATIONS.en.requestedTitle,
          content: 'ณัฐพงษ์ ด. asked for a free 15-minute trial · Tax planning',
        },
        resourceId: chatRoomId,
      });
    });

    it('shows the new card in the open room at once', async () => {
      const sent = await trials.request(advisee, serviceId);

      expect(chat.announceTrial).toHaveBeenCalledWith(sent);
      expect(sent.trialBookingId).toBeNull();
    });

    it('keeps the request when the room cannot be told', async () => {
      chat.announceTrial.mockImplementation(() => {
        throw new Error('socket down');
      });

      await expect(trials.request(advisee, serviceId)).resolves.toEqual(
        expect.objectContaining({ id: requestId }),
      );
    });

    it('falls back to the session name and the row’s service name', async () => {
      repository.findDisplayName.mockResolvedValue(undefined);
      repository.findServiceNames.mockResolvedValue(undefined);

      await trials.request(advisee, serviceId);

      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Nattapong ขอทดลองฟรี 15 นาที · วางแผนภาษี',
        }),
      );
    });

    it('keeps the request when the notification fails', async () => {
      notifications.notify.mockRejectedValue(new Error('push down'));

      await expect(trials.request(advisee, serviceId)).resolves.toEqual(
        expect.objectContaining({ id: requestId }),
      );
    });

    it('refuses a service with no trial', async () => {
      repository.findPublishedService.mockResolvedValue({
        ...service,
        trialEnabled: false,
        trialDurationMinutes: null,
      });

      await expect(trials.request(advisee, serviceId)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.createWithRoom).not.toHaveBeenCalled();
    });

    it('refuses the advisor’s own service', async () => {
      await expect(trials.request(advisor, serviceId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses an unpublished service with a 404', async () => {
      repository.findPublishedService.mockResolvedValue(undefined);

      await expect(trials.request(advisee, serviceId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows one ask per service, whatever the answer was', async () => {
      repository.findForAdvisee.mockResolvedValue(
        makeRow({ status: 'DECLINED' }),
      );

      await expect(trials.request(advisee, serviceId)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.createWithRoom).not.toHaveBeenCalled();
    });

    it('turns a same-moment second ask into a 409', async () => {
      repository.createWithRoom.mockRejectedValue({
        cause: { code: '23505' },
      });

      await expect(trials.request(advisee, serviceId)).rejects.toThrow(
        ConflictException,
      );
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('passes any other database error on', async () => {
      const failure = new Error('connection lost');
      repository.createWithRoom.mockRejectedValue(failure);

      await expect(trials.request(advisee, serviceId)).rejects.toBe(failure);
    });
  });

  describe('findForRoom', () => {
    it('lists the room’s request cards for a member', async () => {
      repository.isRoomMember.mockResolvedValue(true);
      repository.findForRoom.mockResolvedValue([makeRow()]);

      await expect(trials.findForRoom(advisor, chatRoomId)).resolves.toEqual([
        expect.objectContaining({ id: requestId, serviceName: service.name }),
      ]);
      expect(repository.isRoomMember).toHaveBeenCalledWith(
        chatRoomId,
        advisor.id,
      );
    });

    it('hides a room from anyone outside it with a 404', async () => {
      repository.isRoomMember.mockResolvedValue(false);

      await expect(trials.findForRoom(advisee, chatRoomId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findForRoom).not.toHaveBeenCalled();
    });
  });

  describe('decisions', () => {
    const decidedAt = new Date('2026-11-18T01:00:00Z');

    beforeEach(() => {
      repository.findOneForAdvisor.mockResolvedValue(makeRow());
      repository.findDisplayName.mockResolvedValue('กันยา พ.');
      repository.findServiceNames.mockResolvedValue({
        th: 'วางแผนภาษี',
        en: 'Tax planning',
      });
    });

    it('grants a pending request and tells the advisee', async () => {
      repository.decidePending.mockResolvedValue(
        makeRequest({ status: 'GRANTED', decidedAt }),
      );

      await expect(trials.grant(advisor, requestId)).resolves.toEqual(
        expect.objectContaining({ status: 'GRANTED', decidedAt }),
      );
      expect(repository.findOneForAdvisor).toHaveBeenCalledWith(
        requestId,
        advisor.id,
      );
      expect(repository.decidePending).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({ status: 'GRANTED', decisionReason: null }),
      );
      expect(
        repository.decidePending.mock.calls[0][1].decidedAt,
      ).toBeInstanceOf(Date);
      expect(notifications.notify).toHaveBeenCalledWith({
        ownerId: advisee.id,
        type: 'TRIAL_DECIDED',
        title: TRIAL_NOTIFICATIONS.grantedTitle,
        content: TRIAL_NOTIFICATIONS.grantedContent('กันยา พ.'),
        en: {
          title: TRIAL_NOTIFICATIONS.en.grantedTitle,
          content: TRIAL_NOTIFICATIONS.en.grantedContent('กันยา พ.'),
        },
        resourceId: chatRoomId,
      });
    });

    it('shows the decision on the card in the open room', async () => {
      repository.decidePending.mockResolvedValue(
        makeRequest({ status: 'GRANTED', decidedAt }),
      );

      const granted = await trials.grant(advisor, requestId);

      expect(chat.announceTrial).toHaveBeenCalledWith(granted);
    });

    it('names the advisor by the session when they have no display name', async () => {
      repository.findDisplayName.mockResolvedValue(undefined);
      repository.decidePending.mockResolvedValue(
        makeRequest({ status: 'GRANTED', decidedAt }),
      );

      await trials.grant(advisor, requestId);

      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          content: TRIAL_NOTIFICATIONS.grantedContent('Kanya'),
        }),
      );
    });

    it('declines with the advisor’s message and names the service', async () => {
      repository.decidePending.mockResolvedValue(
        makeRequest({
          status: 'DECLINED',
          decisionReason: 'Fully booked',
          decidedAt,
        }),
      );

      await expect(
        trials.decline(advisor, requestId, { message: 'Fully booked' }),
      ).resolves.toEqual(
        expect.objectContaining({
          status: 'DECLINED',
          decisionReason: 'Fully booked',
        }),
      );
      expect(repository.decidePending).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({
          status: 'DECLINED',
          decisionReason: 'Fully booked',
        }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRIAL_DECIDED',
          title: TRIAL_NOTIFICATIONS.declinedTitle,
          content: 'วางแผนภาษี',
          en: {
            title: TRIAL_NOTIFICATIONS.en.declinedTitle,
            content: 'Tax planning',
          },
        }),
      );
    });

    it('declines without a message, falling back to the row’s service name', async () => {
      repository.findServiceNames.mockResolvedValue(undefined);
      repository.decidePending.mockResolvedValue(
        makeRequest({ status: 'DECLINED', decidedAt }),
      );

      await trials.decline(advisor, requestId, {});

      expect(repository.decidePending).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({ decisionReason: null }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ content: service.name }),
      );
    });

    it('can still decline once the service stops offering a trial, but not grant', async () => {
      repository.findOneForAdvisor.mockResolvedValue(
        makeRow({ trialDurationMinutes: null }),
      );
      repository.decidePending.mockResolvedValue(
        makeRequest({ status: 'DECLINED', decidedAt }),
      );

      await expect(trials.grant(advisor, requestId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        trials.decline(advisor, requestId, {}),
      ).resolves.toBeDefined();
    });

    it('refuses another advisor’s request with a 404', async () => {
      repository.findOneForAdvisor.mockResolvedValue(undefined);

      await expect(trials.grant(advisee, requestId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses a request already decided', async () => {
      repository.findOneForAdvisor.mockResolvedValue(
        makeRow({ status: 'GRANTED' }),
      );

      await expect(trials.decline(advisor, requestId, {})).rejects.toThrow(
        ConflictException,
      );
      expect(repository.decidePending).not.toHaveBeenCalled();
    });

    it('refuses the second of two decisions made at the same moment', async () => {
      repository.decidePending.mockResolvedValue(undefined);

      await expect(trials.grant(advisor, requestId)).rejects.toThrow(
        ConflictException,
      );
      expect(notifications.notify).not.toHaveBeenCalled();
    });
  });
});
