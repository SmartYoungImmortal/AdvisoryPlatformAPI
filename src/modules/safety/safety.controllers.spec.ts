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

import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminOffPlatformFlagsController } from './admin-off-platform-flags.controller';
import { AdminReportsController } from './admin-reports.controller';
import type { OffPlatformFlagsService } from './off-platform-flags.service';
import { ReportsController } from './reports.controller';
import type { ReportsService } from './reports.service';
import { OffPlatformFlagQueryDto } from './dtos/off-platform-flag-query.dto';
import { ReportQueryDto } from './dtos/report-query.dto';
import type { CreateReportDto } from './dtos/create-report.dto';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const admin = { id: '99999999-9999-9999-9999-999999999999' } as SessionUser;
const reportId = '33333333-3333-3333-3333-333333333333';
const flagId = '55555555-5555-5555-5555-555555555555';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reports: jest.Mocked<ReportsService>;

  beforeEach(() => {
    reports = {
      submit: jest.fn(),
      findMine: jest.fn(),
    } as unknown as jest.Mocked<ReportsService>;
    controller = new ReportsController(reports);
  });

  it('delegates a submission using the session user, not a body field', () => {
    const dto = {
      reportedUserId: '22222222-2222-2222-2222-222222222222',
      reason: 'Spam',
    } as CreateReportDto;
    const result = Promise.resolve({ id: reportId });
    reports.submit.mockReturnValue(
      result as ReturnType<ReportsService['submit']>,
    );

    expect(controller.submit(user, dto)).toBe(result);
    expect(reports.submit).toHaveBeenCalledWith(user, dto);
  });

  it('delegates the own-report list using the session user', () => {
    const query = new OffsetPaginationDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    reports.findMine.mockReturnValue(result);

    expect(controller.findMine(user, query)).toBe(result);
    expect(reports.findMine).toHaveBeenCalledWith(user, query);
  });

  it.each([
    ['submit', { permission: { report: ['submitSelf'] } }],
    ['findMine', { permission: { report: ['readSelf'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      ReportsController.prototype[method as keyof ReportsController];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});

describe('AdminReportsController', () => {
  let controller: AdminReportsController;
  let reports: jest.Mocked<ReportsService>;

  beforeEach(() => {
    reports = {
      findManyForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      resolve: jest.fn(),
    } as unknown as jest.Mocked<ReportsService>;
    controller = new AdminReportsController(reports);
  });

  it('delegates the queue with its filters', () => {
    const query = new ReportQueryDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    reports.findManyForAdmin.mockReturnValue(result);

    expect(controller.findMany(query)).toBe(result);
    expect(reports.findManyForAdmin).toHaveBeenCalledWith(query);
  });

  it('delegates the ruling using the session admin and the route id', () => {
    const result = Promise.resolve({ id: reportId });
    reports.resolve.mockReturnValue(
      result as ReturnType<ReportsService['resolve']>,
    );

    expect(controller.resolve(admin, reportId, { outcome: 'ACTIONED' })).toBe(
      result,
    );
    expect(reports.resolve).toHaveBeenCalledWith(admin, reportId, {
      outcome: 'ACTIONED',
    });
  });

  it.each([
    ['findMany', { permission: { report: ['read'] } }],
    ['findOne', { permission: { report: ['read'] } }],
    ['resolve', { permission: { report: ['decide'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      AdminReportsController.prototype[method as keyof AdminReportsController];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});

describe('AdminOffPlatformFlagsController', () => {
  let controller: AdminOffPlatformFlagsController;
  let flags: jest.Mocked<OffPlatformFlagsService>;

  beforeEach(() => {
    flags = {
      findMany: jest.fn(),
      resolve: jest.fn(),
    } as unknown as jest.Mocked<OffPlatformFlagsService>;
    controller = new AdminOffPlatformFlagsController(flags);
  });

  it('delegates the flag queue with its filters', () => {
    const query = new OffPlatformFlagQueryDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    flags.findMany.mockReturnValue(result);

    expect(controller.findMany(query)).toBe(result);
    expect(flags.findMany).toHaveBeenCalledWith(query);
  });

  it('delegates the flag ruling using the session admin and the route id', () => {
    const dto = { outcome: 'CONFIRMED' as const, penaltyPointsApplied: 2 };
    const result = Promise.resolve({ id: flagId });
    flags.resolve.mockReturnValue(
      result as ReturnType<OffPlatformFlagsService['resolve']>,
    );

    expect(controller.resolve(admin, flagId, dto)).toBe(result);
    expect(flags.resolve).toHaveBeenCalledWith(admin, flagId, dto);
  });

  it.each([
    ['findMany', { permission: { offPlatformFlag: ['read'] } }],
    ['resolve', { permission: { offPlatformFlag: ['decide'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      AdminOffPlatformFlagsController.prototype[
        method as keyof AdminOffPlatformFlagsController
      ];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});
