import { NotFoundException } from '@nestjs/common';
import type { CaseContextRepository } from './case-context.repository';
import { CaseContextService } from './case-context.service';
import type { OffPlatformFlagsRepository } from './off-platform-flags.repository';
import type { CaseAppointmentRow, CaseMessageRow } from './safety.types';
import type { UserReportsRepository } from './user-reports.repository';

const roomId = '11111111-1111-4111-8111-111111111111';
const messageId = '22222222-2222-4222-8222-222222222222';

function messageRow(): CaseMessageRow {
  return {
    id: messageId,
    senderUserId: '33333333-3333-4333-8333-333333333333',
    senderDisplayName: 'Advisor',
    senderFullName: 'Advisor Example',
    message: 'add me on LINE',
    createdAt: new Date('2026-09-01T00:00:00Z'),
  };
}

function appointmentRow(chatRoomId: string | null = roomId) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    serviceId: '55555555-5555-4555-8555-555555555555',
    serviceName: 'Tax planning',
    advisorId: '33333333-3333-4333-8333-333333333333',
    adviseeId: '66666666-6666-4666-8666-666666666666',
    type: 'CONSULTATION',
    state: 'COMPLETED',
    startTime: new Date('2026-09-01T02:00:00Z'),
    endTime: new Date('2026-09-01T03:00:00Z'),
    cancelledAt: null,
    cancelledByUserId: null,
    jitsiRoomName: null,
    invoiceAmountSatang: 150000,
    invoiceStatus: 'RELEASED',
    chatRoomId,
  } as CaseAppointmentRow & { chatRoomId: string | null };
}

/**
 * Which evidence a moderator sees for each kind of case, including the cases with
 * nothing to show — a report filed outside any chat, a refund whose appointment
 * never had a room, a flag whose message has since gone.
 */
describe('CaseContextService', () => {
  let reports: jest.Mocked<Pick<UserReportsRepository, 'findById'>>;
  let flags: jest.Mocked<Pick<OffPlatformFlagsRepository, 'findById'>>;
  let context: jest.Mocked<
    Pick<
      CaseContextRepository,
      'conversation' | 'message' | 'appointmentForRoom' | 'appointmentForRefund'
    >
  >;
  let service: CaseContextService;

  beforeEach(() => {
    reports = { findById: jest.fn() };
    flags = { findById: jest.fn() };
    context = {
      conversation: jest.fn().mockResolvedValue([messageRow()]),
      message: jest.fn(),
      appointmentForRoom: jest.fn().mockResolvedValue(appointmentRow()),
      appointmentForRefund: jest.fn(),
    };
    service = new CaseContextService(
      reports as unknown as UserReportsRepository,
      flags as unknown as OffPlatformFlagsRepository,
      context as unknown as CaseContextRepository,
    );
  });

  describe('a report', () => {
    it('404s when the report does not exist', async () => {
      reports.findById.mockResolvedValue(undefined);

      await expect(service.forReport('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('has no evidence when it was filed outside a chat', async () => {
      reports.findById.mockResolvedValue({ chatRoomId: null } as never);

      const result = await service.forReport('report');

      expect(result).toEqual({
        flaggedMessageId: null,
        conversation: [],
        appointment: null,
      });
      expect(context.conversation).not.toHaveBeenCalled();
    });

    it("shows the room's conversation and appointment", async () => {
      reports.findById.mockResolvedValue({ chatRoomId: roomId } as never);

      const result = await service.forReport('report');

      expect(context.conversation).toHaveBeenCalledWith(roomId);
      expect(context.appointmentForRoom).toHaveBeenCalledWith(roomId);
      expect(result.conversation).toHaveLength(1);
      expect(result.appointment?.serviceName).toBe('Tax planning');
    });
  });

  describe('a refund', () => {
    it('404s when no appointment stands behind it', async () => {
      context.appointmentForRefund.mockResolvedValue(undefined);

      await expect(service.forRefund('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('shows the appointment alone when it never had a chat room', async () => {
      context.appointmentForRefund.mockResolvedValue(appointmentRow(null));

      const result = await service.forRefund('refund');

      expect(context.conversation).not.toHaveBeenCalled();
      expect(result.conversation).toEqual([]);
      expect(result.appointment?.invoiceStatus).toBe('RELEASED');
    });

    it("shows the appointment's conversation when it has a room", async () => {
      context.appointmentForRefund.mockResolvedValue(appointmentRow());

      const result = await service.forRefund('refund');

      expect(context.conversation).toHaveBeenCalledWith(roomId);
      expect(result.conversation).toHaveLength(1);
    });
  });

  describe('an off-platform flag', () => {
    it('404s when the flag does not exist', async () => {
      flags.findById.mockResolvedValue(undefined);

      await expect(service.forFlag('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('still names the flagged message when that message is gone', async () => {
      flags.findById.mockResolvedValue({ messageId } as never);
      context.message.mockResolvedValue(undefined);

      const result = await service.forFlag('flag');

      expect(result).toEqual({
        flaggedMessageId: messageId,
        conversation: [],
        appointment: null,
      });
    });

    it('shows the conversation around the flagged message', async () => {
      flags.findById.mockResolvedValue({ messageId } as never);
      context.message.mockResolvedValue({
        ...messageRow(),
        chatRoomId: roomId,
      });

      const result = await service.forFlag('flag');

      expect(context.conversation).toHaveBeenCalledWith(roomId);
      expect(result.flaggedMessageId).toBe(messageId);
      expect(result.appointment).not.toBeNull();
    });
  });
});
