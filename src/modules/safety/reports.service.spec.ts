import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { userReports } from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AdminProfilesRepository } from './admin-profiles.repository';
import { ReportsService } from './reports.service';
import type { AdminReportRow } from './safety.types';
import type { UserReportsRepository } from './user-reports.repository';
import { ReportQueryDto } from './dtos/report-query.dto';

type UserReport = InferSelectModel<typeof userReports>;

const reporter = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const admin = { id: '99999999-9999-9999-9999-999999999999' } as SessionUser;
const reportedUserId = '22222222-2222-2222-2222-222222222222';
const reportId = '33333333-3333-3333-3333-333333333333';
const chatRoomId = '44444444-4444-4444-4444-444444444444';

function makeReport(overrides: Partial<UserReport> = {}): UserReport {
  return {
    id: reportId,
    reporterUserId: reporter.id,
    reportedUserId,
    chatRoomId: null,
    reason: 'Asked me to pay outside the platform',
    status: 'OPEN',
    reviewedByAdminId: null,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    resolvedAt: null,
    ...overrides,
  };
}

function makeAdminRow(overrides: Partial<AdminReportRow> = {}): AdminReportRow {
  return {
    id: reportId,
    reporterUserId: reporter.id,
    reporterDisplayName: 'Reporter',
    reportedUserId,
    reportedDisplayName: 'Reported',
    chatRoomId: null,
    reason: 'Asked me to pay outside the platform',
    status: 'OPEN',
    reviewedByAdminId: null,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    resolvedAt: null,
    ...overrides,
  };
}

describe('ReportsService', () => {
  let service: ReportsService;
  let reports: jest.Mocked<
    Pick<
      UserReportsRepository,
      | 'create'
      | 'findById'
      | 'findDisplayName'
      | 'isChatRoomMember'
      | 'findManyByReporter'
      | 'countByReporter'
      | 'findManyForAdmin'
      | 'countForAdmin'
      | 'findOneForAdmin'
      | 'resolveIfOpen'
    >
  >;
  let admins: jest.Mocked<Pick<AdminProfilesRepository, 'exists'>>;

  beforeEach(() => {
    reports = {
      create: jest.fn(),
      findById: jest.fn(),
      findDisplayName: jest.fn(),
      isChatRoomMember: jest.fn(),
      findManyByReporter: jest.fn(),
      countByReporter: jest.fn(),
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      resolveIfOpen: jest.fn(),
    };
    admins = { exists: jest.fn() };
    service = new ReportsService(
      reports as unknown as UserReportsRepository,
      admins as unknown as AdminProfilesRepository,
    );
  });

  it('takes the reporter from the session, never from the request', async () => {
    reports.findDisplayName.mockResolvedValue('Reported');
    reports.create.mockResolvedValue(makeReport());

    await service.submit(reporter, { reportedUserId, reason: 'Spam' });

    expect(reports.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterUserId: reporter.id,
        reportedUserId,
        chatRoomId: null,
        reason: 'Spam',
      }),
    );
  });

  it('ignores any reporter id smuggled into the body', async () => {
    reports.findDisplayName.mockResolvedValue('Reported');
    reports.create.mockResolvedValue(makeReport());
    const forged = {
      reportedUserId,
      reason: 'Spam',
      reporterUserId: admin.id,
    } as Parameters<ReportsService['submit']>[1];

    await service.submit(reporter, forged);

    const [values] = reports.create.mock.calls[0];
    expect(values.reporterUserId).toBe(reporter.id);
  });

  it('rejects a report filed against yourself', async () => {
    await expect(
      service.submit(reporter, {
        reportedUserId: reporter.id,
        reason: 'Testing',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(reports.create).not.toHaveBeenCalled();
  });

  it('rejects a report against an account that does not exist', async () => {
    reports.findDisplayName.mockResolvedValue(undefined);

    await expect(
      service.submit(reporter, { reportedUserId, reason: 'Spam' }),
    ).rejects.toThrow(BadRequestException);
    expect(reports.create).not.toHaveBeenCalled();
  });

  it('rejects a chat room the reporter is not a member of', async () => {
    reports.findDisplayName.mockResolvedValue('Reported');
    reports.isChatRoomMember.mockResolvedValue(false);

    await expect(
      service.submit(reporter, { reportedUserId, chatRoomId, reason: 'Spam' }),
    ).rejects.toThrow(BadRequestException);
    expect(reports.create).not.toHaveBeenCalled();
  });

  it('keeps a cited chat room the reporter belongs to', async () => {
    reports.findDisplayName.mockResolvedValue('Reported');
    reports.isChatRoomMember.mockResolvedValue(true);
    reports.create.mockResolvedValue(makeReport({ chatRoomId }));

    await service.submit(reporter, {
      reportedUserId,
      chatRoomId,
      reason: 'Spam',
    });

    expect(reports.isChatRoomMember).toHaveBeenCalledWith(
      chatRoomId,
      reporter.id,
    );
    expect(reports.create).toHaveBeenCalledWith(
      expect.objectContaining({ chatRoomId }),
    );
  });

  it('answers a submission without the admin-only fields', async () => {
    reports.findDisplayName.mockResolvedValue('Reported');
    reports.create.mockResolvedValue(makeReport());

    const created = await service.submit(reporter, {
      reportedUserId,
      reason: 'Spam',
    });

    expect(created).toEqual(
      expect.objectContaining({
        id: reportId,
        reportedUserId,
        reportedDisplayName: 'Reported',
        status: 'OPEN',
      }),
    );
    expect(created).not.toHaveProperty('reviewedByAdminId');
    expect(created).not.toHaveProperty('reporterUserId');
  });

  it('scopes the own-report list to the session user', async () => {
    reports.findManyByReporter.mockResolvedValue([]);
    reports.countByReporter.mockResolvedValue(0);
    const query = Object.assign(new OffsetPaginationDto(), {
      page: 1,
      limit: 20,
    });

    await service.findMine(reporter, query);

    expect(reports.findManyByReporter).toHaveBeenCalledWith(reporter.id, {
      limit: 20,
      offset: 0,
    });
    expect(reports.countByReporter).toHaveBeenCalledWith(reporter.id);
  });

  it('passes the status filter to both the page and its count', async () => {
    reports.findManyForAdmin.mockResolvedValue([makeAdminRow()]);
    reports.countForAdmin.mockResolvedValue(1);
    const query = Object.assign(new ReportQueryDto(), {
      page: 1,
      limit: 20,
      status: 'OPEN' as const,
    });

    await expect(service.findManyForAdmin(query)).resolves.toEqual({
      items: [expect.objectContaining({ id: reportId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(reports.findManyForAdmin).toHaveBeenCalledWith('OPEN', {
      limit: 20,
      offset: 0,
    });
    expect(reports.countForAdmin).toHaveBeenCalledWith('OPEN');
  });

  it('exposes both parties by display name and nothing more', async () => {
    reports.findOneForAdmin.mockResolvedValue(makeAdminRow());

    const row = await service.findOneForAdmin(reportId);

    expect(row).toEqual(
      expect.objectContaining({
        reporterDisplayName: 'Reporter',
        reportedDisplayName: 'Reported',
      }),
    );
    expect(Object.keys(row).sort()).toEqual(
      [
        'chatRoomId',
        'createdAt',
        'id',
        'reason',
        'reportedDisplayName',
        'reportedUserId',
        'reporterDisplayName',
        'reporterUserId',
        'resolvedAt',
        'reviewedByAdminId',
        'status',
      ].sort(),
    );
  });

  it('reports a missing report to the admin as a 404', async () => {
    reports.findOneForAdmin.mockResolvedValue(undefined);

    await expect(service.findOneForAdmin(reportId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('stamps the ruling with the deciding admin', async () => {
    admins.exists.mockResolvedValue(true);
    reports.resolveIfOpen.mockResolvedValue(
      makeAdminRow({ status: 'ACTIONED', reviewedByAdminId: admin.id }),
    );

    await expect(
      service.resolve(admin, reportId, { outcome: 'ACTIONED' }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'ACTIONED',
        reviewedByAdminId: admin.id,
      }),
    );
    expect(reports.resolveIfOpen).toHaveBeenCalledWith(
      reportId,
      expect.objectContaining({
        status: 'ACTIONED',
        reviewedByAdminId: admin.id,
      }),
    );
  });

  it('refuses to rule when the admin has no admin profile row', async () => {
    admins.exists.mockResolvedValue(false);

    await expect(
      service.resolve(admin, reportId, { outcome: 'DISMISSED' }),
    ).rejects.toThrow(ForbiddenException);
    expect(reports.resolveIfOpen).not.toHaveBeenCalled();
  });

  it('rejects a second ruling on an already resolved report', async () => {
    admins.exists.mockResolvedValue(true);
    reports.resolveIfOpen.mockResolvedValue(undefined);
    reports.findById.mockResolvedValue(
      makeReport({ status: 'DISMISSED', reviewedByAdminId: admin.id }),
    );

    await expect(
      service.resolve(admin, reportId, { outcome: 'ACTIONED' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rules on a report that is not there with a 404, not a 409', async () => {
    admins.exists.mockResolvedValue(true);
    reports.resolveIfOpen.mockResolvedValue(undefined);
    reports.findById.mockResolvedValue(undefined);

    await expect(
      service.resolve(admin, reportId, { outcome: 'ACTIONED' }),
    ).rejects.toThrow(NotFoundException);
  });
});
