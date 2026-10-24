import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import type { services } from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AvailabilityService } from '@/modules/availability/availability.service';
import { SERVICE_IMAGE_URL_EXPIRY_SECONDS } from './advisor-services.constants';
import type { AdvisorServicesRepository } from './advisor-services.repository';
import { AdvisorServicesService } from './advisor-services.service';
import type { PublicServiceDocument } from './advisor-services.types';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import { PublicServiceQueryDto } from './dtos/public-service-query.dto';

type AdvisorService = InferSelectModel<typeof services>;

const advisor = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const serviceId = '22222222-2222-2222-2222-222222222222';
const categoryId = '33333333-3333-3333-3333-333333333333';
const profileId = '44444444-4444-4444-4444-444444444444';

const publicService: PublicServiceDocument = {
  id: serviceId,
  advisorId: advisor.id,
  categoryId,
  name: 'Career coaching',
  description: 'Practical career planning',
  priceSatang: 150000,
  durationMinutes: 60,
  screeningRequired: false,
  trialEnabled: false,
  trialDurationMinutes: null,
  createdAt: new Date('2026-08-29T00:00:00Z'),
};

function makeService(overrides: Partial<AdvisorService> = {}): AdvisorService {
  return {
    id: serviceId,
    advisorId: advisor.id,
    categoryId,
    availabilityProfileId: profileId,
    name: 'Career coaching',
    description: 'Practical career planning',
    priceSatang: 150000,
    durationMinutes: 60,
    dailyConsultationLimitMinutes: null,
    isPublished: false,
    screeningRequired: false,
    trialEnabled: false,
    trialDurationMinutes: null,
    createdAt: new Date('2026-08-29T00:00:00Z'),
    modifiedAt: new Date('2026-08-29T00:00:00Z'),
    ...overrides,
  };
}

describe('AdvisorServicesService', () => {
  let service: AdvisorServicesService;
  let repository: jest.Mocked<
    Pick<
      AdvisorServicesRepository,
      | 'findMany'
      | 'count'
      | 'findManyByAdvisorId'
      | 'countByAdvisorId'
      | 'findOwnedById'
      | 'categoryExists'
      | 'availabilityProfileOwned'
      | 'create'
      | 'updateOwned'
      | 'deleteOwned'
      | 'findPublished'
      | 'countPublished'
      | 'findPublishedById'
      | 'findImageKeysFor'
    >
  >;
  let availability: jest.Mocked<Pick<AvailabilityService, 'hasOpenSlotOn'>>;
  let storage: jest.Mocked<Pick<SeaweedFsStorageService, 'createDownloadUrl'>>;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      count: jest.fn(),
      findManyByAdvisorId: jest.fn(),
      countByAdvisorId: jest.fn(),
      findOwnedById: jest.fn(),
      categoryExists: jest.fn(),
      availabilityProfileOwned: jest.fn(),
      create: jest.fn(),
      updateOwned: jest.fn(),
      deleteOwned: jest.fn(),
      findPublished: jest.fn(),
      countPublished: jest.fn(),
      findPublishedById: jest.fn(),
      findImageKeysFor: jest.fn().mockResolvedValue([]),
    };
    availability = { hasOpenSlotOn: jest.fn() };
    storage = { createDownloadUrl: jest.fn() };
    service = new AdvisorServicesService(
      repository as unknown as AdvisorServicesRepository,
      availability as unknown as AvailabilityService,
      storage as unknown as SeaweedFsStorageService,
    );
  });

  it('lists only the current advisor services', async () => {
    repository.findManyByAdvisorId.mockResolvedValue([makeService()]);
    repository.countByAdvisorId.mockResolvedValue(1);
    const query = Object.assign(new AdvisorServiceQueryDto(), {
      page: 1,
      limit: 20,
    });

    await expect(service.findMany(advisor, query)).resolves.toEqual({
      items: [expect.objectContaining({ id: serviceId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(repository.findManyByAdvisorId).toHaveBeenCalledWith(advisor.id, {
      limit: 20,
      offset: 0,
    });
  });

  it('creates an owned service only for an existing category and own profile', async () => {
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(true);
    repository.create.mockResolvedValue(makeService());

    await expect(
      service.create(advisor, {
        categoryId,
        availabilityProfileId: profileId,
        name: 'Career coaching',
        priceSatang: 150000,
        durationMinutes: 60,
      }),
    ).resolves.toEqual(expect.objectContaining({ id: serviceId }));

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        advisorId: advisor.id,
        categoryId,
        availabilityProfileId: profileId,
        dailyConsultationLimitMinutes: null,
        trialEnabled: false,
        trialDurationMinutes: null,
      }),
    );
  });

  it('rejects service creation with another advisor profile', async () => {
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(false);

    await expect(
      service.create(advisor, {
        categoryId,
        availabilityProfileId: profileId,
        name: 'Career coaching',
        priceSatang: 150000,
        durationMinutes: 60,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires a trial duration when trial is enabled', async () => {
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(true);

    await expect(
      service.create(advisor, {
        categoryId,
        availabilityProfileId: profileId,
        name: 'Trial service',
        priceSatang: 0,
        durationMinutes: 60,
        trialEnabled: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not reveal a service owned by another advisor', async () => {
    repository.findOwnedById.mockResolvedValue(undefined);

    await expect(service.findOne(advisor, serviceId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('turning off trial clears its duration', async () => {
    repository.findOwnedById.mockResolvedValue(
      makeService({ trialEnabled: true, trialDurationMinutes: 30 }),
    );
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(true);
    repository.updateOwned.mockResolvedValue(makeService());

    await service.update(advisor, serviceId, { trialEnabled: false });

    expect(repository.updateOwned).toHaveBeenCalledWith(
      advisor.id,
      serviceId,
      expect.objectContaining({
        trialEnabled: false,
        trialDurationMinutes: null,
      }),
    );
  });

  it('searches published Services directly in Postgres', async () => {
    repository.findPublished.mockResolvedValue([publicService]);
    repository.countPublished.mockResolvedValue(1);
    const query = Object.assign(new PublicServiceQueryDto(), {
      page: 1,
      limit: 20,
      q: 'career',
      categoryId,
    });

    await expect(service.findPublished(query)).resolves.toEqual({
      items: [expect.objectContaining({ id: serviceId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(repository.findPublished).toHaveBeenCalledWith(query, {
      limit: 20,
      offset: 0,
    });
    expect(repository.countPublished).toHaveBeenCalledWith(query);
  });

  it('keeps only services with an open slot on the requested date, paging after the check', async () => {
    const closed = {
      ...publicService,
      id: '55555555-5555-5555-5555-555555555555',
    };
    repository.findPublished.mockResolvedValue([publicService, closed]);
    availability.hasOpenSlotOn.mockImplementation((id) =>
      Promise.resolve(id === serviceId),
    );
    const query = Object.assign(new PublicServiceQueryDto(), {
      page: 1,
      limit: 20,
      availableOn: '2026-10-24',
    });

    await expect(service.findPublished(query)).resolves.toEqual({
      items: [expect.objectContaining({ id: serviceId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(availability.hasOpenSlotOn).toHaveBeenCalledWith(
      serviceId,
      '2026-10-24',
    );
    expect(repository.countPublished).not.toHaveBeenCalled();
  });

  it('rejects an inverted public service price range before searching', async () => {
    const query = Object.assign(new PublicServiceQueryDto(), {
      minPriceSatang: 200000,
      maxPriceSatang: 100000,
    });

    await expect(service.findPublished(query)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.findPublished).not.toHaveBeenCalled();
  });

  it('lists every Service for an Admin rather than one advisor', async () => {
    repository.findMany.mockResolvedValue([makeService()]);
    repository.count.mockResolvedValue(1);
    const query = Object.assign(new AdvisorServiceQueryDto(), {
      page: 1,
      limit: 20,
    });

    await expect(service.findManyForAdmin(query)).resolves.toEqual({
      items: [expect.objectContaining({ id: serviceId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(repository.findMany).toHaveBeenCalledWith(undefined, {
      limit: 20,
      offset: 0,
    });
  });

  it('returns a published Service through the public DTO', async () => {
    repository.findPublishedById.mockResolvedValue(publicService);

    await expect(service.findPublishedById(serviceId)).resolves.toEqual(
      expect.objectContaining({ id: serviceId }),
    );
  });

  it('hides an unpublished Service from the public detail route', async () => {
    repository.findPublishedById.mockResolvedValue(undefined);

    await expect(service.findPublishedById(serviceId)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findImageKeysFor).not.toHaveBeenCalled();
  });

  describe('photographs', () => {
    const otherId = '66666666-6666-6666-6666-666666666666';
    const other = { ...publicService, id: otherId };
    const photo = (name: string) => `https://cdn.example.test/${name}.jpg`;
    const page = Object.assign(new PublicServiceQueryDto(), {
      page: 1,
      limit: 20,
    });

    it('reads a whole page of photographs in one query and keeps each service in carousel order', async () => {
      repository.findPublished.mockResolvedValue([publicService, other]);
      repository.countPublished.mockResolvedValue(2);
      // Interleaved on purpose: grouping must keep each service's own order.
      repository.findImageKeysFor.mockResolvedValue([
        { serviceId, objectKey: photo('a-1') },
        { serviceId: otherId, objectKey: photo('b-1') },
        { serviceId, objectKey: photo('a-2') },
      ]);

      const result = await service.findPublished(page);

      expect(repository.findImageKeysFor).toHaveBeenCalledTimes(1);
      expect(repository.findImageKeysFor).toHaveBeenCalledWith([
        serviceId,
        otherId,
      ]);
      expect(result.items.map((item) => item.images)).toEqual([
        [photo('a-1'), photo('a-2')],
        [photo('b-1')],
      ]);
    });

    it('gives a listed service with no photographs an empty list', async () => {
      repository.findPublished.mockResolvedValue([publicService]);
      repository.countPublished.mockResolvedValue(1);

      const result = await service.findPublished(page);

      expect(result.items[0].images).toEqual([]);
    });

    it('lists only URL keys, unchanged, and never presigns for a page of results', async () => {
      repository.findPublished.mockResolvedValue([publicService]);
      repository.countPublished.mockResolvedValue(1);
      repository.findImageKeysFor.mockResolvedValue([
        { serviceId, objectKey: 'services/stored-in-seaweedfs.jpg' },
        { serviceId, objectKey: 'http://cdn.example.test/plain-http.jpg' },
        { serviceId, objectKey: photo('a-2') },
      ]);

      const result = await service.findPublished(page);

      expect(result.items[0].images).toEqual([
        'http://cdn.example.test/plain-http.jpg',
        photo('a-2'),
      ]);
      expect(storage.createDownloadUrl).not.toHaveBeenCalled();
    });

    it('reads photographs only for the page an available-today search returns', async () => {
      repository.findPublished.mockResolvedValue([publicService, other]);
      availability.hasOpenSlotOn.mockImplementation((id) =>
        Promise.resolve(id === otherId),
      );
      repository.findImageKeysFor.mockResolvedValue([
        { serviceId: otherId, objectKey: photo('b-1') },
      ]);

      const result = await service.findPublished(
        Object.assign(new PublicServiceQueryDto(), {
          page: 1,
          limit: 20,
          availableOn: '2026-10-24',
        }),
      );

      expect(repository.findImageKeysFor).toHaveBeenCalledTimes(1);
      expect(repository.findImageKeysFor).toHaveBeenCalledWith([otherId]);
      expect(result.items).toEqual([
        expect.objectContaining({ id: otherId, images: [photo('b-1')] }),
      ]);
    });

    it('passes URL keys through and presigns storage keys on the detail route, in carousel order', async () => {
      repository.findPublishedById.mockResolvedValue(publicService);
      repository.findImageKeysFor.mockResolvedValue([
        { serviceId, objectKey: photo('a-1') },
        { serviceId, objectKey: 'services/a-2.jpg' },
        { serviceId, objectKey: photo('a-3') },
      ]);
      storage.createDownloadUrl.mockResolvedValue(
        'http://seaweedfs.test/signed-a-2',
      );

      const result = await service.findPublishedById(serviceId);

      expect(repository.findImageKeysFor).toHaveBeenCalledWith([serviceId]);
      expect(result.images).toEqual([
        photo('a-1'),
        'http://seaweedfs.test/signed-a-2',
        photo('a-3'),
      ]);
      expect(storage.createDownloadUrl).toHaveBeenCalledTimes(1);
      expect(storage.createDownloadUrl).toHaveBeenCalledWith(
        'services/a-2.jpg',
        SERVICE_IMAGE_URL_EXPIRY_SECONDS,
      );
    });

    it('leaves out a photograph storage cannot sign instead of failing the detail', async () => {
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      repository.findPublishedById.mockResolvedValue(publicService);
      repository.findImageKeysFor.mockResolvedValue([
        { serviceId, objectKey: 'services/a-1.jpg' },
        { serviceId, objectKey: photo('a-2') },
      ]);
      storage.createDownloadUrl.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.findPublishedById(serviceId)).resolves.toEqual(
        expect.objectContaining({ id: serviceId, images: [photo('a-2')] }),
      );
      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });
  });

  it('rejects service creation against a category that does not exist', async () => {
    repository.categoryExists.mockResolvedValue(false);
    repository.availabilityProfileOwned.mockResolvedValue(true);

    await expect(
      service.create(advisor, {
        categoryId,
        availabilityProfileId: profileId,
        name: 'Career coaching',
        priceSatang: 150000,
        durationMinutes: 60,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a trial duration while trial is disabled', async () => {
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(true);

    await expect(
      service.create(advisor, {
        categoryId,
        availabilityProfileId: profileId,
        name: 'Career coaching',
        priceSatang: 150000,
        durationMinutes: 60,
        trialDurationMinutes: 30,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('stores the trial duration when trial is enabled on create', async () => {
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(true);
    repository.create.mockResolvedValue(
      makeService({ trialEnabled: true, trialDurationMinutes: 30 }),
    );

    await service.create(advisor, {
      categoryId,
      availabilityProfileId: profileId,
      name: 'Trial service',
      priceSatang: 150000,
      durationMinutes: 60,
      trialEnabled: true,
      trialDurationMinutes: 30,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ trialEnabled: true, trialDurationMinutes: 30 }),
    );
  });

  it('keeps the stored trial duration when an update leaves trial on', async () => {
    repository.findOwnedById.mockResolvedValue(
      makeService({ trialEnabled: true, trialDurationMinutes: 45 }),
    );
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(true);
    repository.updateOwned.mockResolvedValue(makeService());

    await service.update(advisor, serviceId, { name: 'Renamed' });

    expect(repository.updateOwned).toHaveBeenCalledWith(
      advisor.id,
      serviceId,
      expect.objectContaining({ trialEnabled: true, trialDurationMinutes: 45 }),
    );
  });

  it('requires an availability profile before a Service can be updated', async () => {
    repository.findOwnedById.mockResolvedValue(
      makeService({ availabilityProfileId: null }),
    );

    await expect(
      service.update(advisor, serviceId, { name: 'Renamed' }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.updateOwned).not.toHaveBeenCalled();
  });

  it('reports a Service that disappeared between the read and the update', async () => {
    repository.findOwnedById.mockResolvedValue(makeService());
    repository.categoryExists.mockResolvedValue(true);
    repository.availabilityProfileOwned.mockResolvedValue(true);
    repository.updateOwned.mockResolvedValue(undefined);

    await expect(
      service.update(advisor, serviceId, { name: 'Renamed' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns the deleted Service so the caller can show what went', async () => {
    repository.deleteOwned.mockResolvedValue(makeService());

    await expect(service.delete(advisor, serviceId)).resolves.toEqual(
      expect.objectContaining({ id: serviceId }),
    );
  });

  it('does not delete a Service owned by another advisor', async () => {
    repository.deleteOwned.mockResolvedValue(undefined);

    await expect(service.delete(advisor, serviceId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
