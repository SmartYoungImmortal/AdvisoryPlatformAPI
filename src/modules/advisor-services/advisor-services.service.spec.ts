import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { services } from '@/database/schema';
import type { ElasticsearchGateway } from '@/common/search/elasticsearch.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AdvisorServicesRepository } from './advisor-services.repository';
import { AdvisorServicesService } from './advisor-services.service';
import type { PublicServiceSearchDocument } from './advisor-services.types';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import { PublicServiceQueryDto } from './dtos/public-service-query.dto';

type AdvisorService = InferSelectModel<typeof services>;

const advisor = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const serviceId = '22222222-2222-2222-2222-222222222222';
const categoryId = '33333333-3333-3333-3333-333333333333';
const profileId = '44444444-4444-4444-4444-444444444444';

const publicService: PublicServiceSearchDocument = {
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
      | 'findManyByAdvisorId'
      | 'countByAdvisorId'
      | 'findOwnedById'
      | 'categoryExists'
      | 'availabilityProfileOwned'
      | 'create'
      | 'updateOwned'
      | 'deleteOwned'
      | 'findPublishedByIds'
      | 'findPublishedById'
      | 'findAllPublished'
    >
  >;
  let elasticsearch: jest.Mocked<
    Pick<
      ElasticsearchGateway,
      | 'search'
      | 'indexExists'
      | 'createIndex'
      | 'deleteIndex'
      | 'indexDocument'
      | 'deleteDocument'
      | 'bulkIndex'
    >
  >;

  beforeEach(() => {
    repository = {
      findManyByAdvisorId: jest.fn(),
      countByAdvisorId: jest.fn(),
      findOwnedById: jest.fn(),
      categoryExists: jest.fn(),
      availabilityProfileOwned: jest.fn(),
      create: jest.fn(),
      updateOwned: jest.fn(),
      deleteOwned: jest.fn(),
      findPublishedByIds: jest.fn(),
      findPublishedById: jest.fn(),
      findAllPublished: jest.fn(),
    };
    elasticsearch = {
      search: jest.fn(),
      indexExists: jest.fn().mockResolvedValue(true),
      createIndex: jest.fn(),
      deleteIndex: jest.fn(),
      indexDocument: jest.fn(),
      deleteDocument: jest.fn(),
      bulkIndex: jest.fn(),
    };
    service = new AdvisorServicesService(
      repository as unknown as AdvisorServicesRepository,
      elasticsearch as ElasticsearchGateway,
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

  it('searches the Service index and rechecks hits in Postgres', async () => {
    elasticsearch.search.mockResolvedValue({
      documents: [publicService],
      total: 1,
    });
    repository.findPublishedByIds.mockResolvedValue([publicService]);
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
    expect(elasticsearch.search).toHaveBeenCalledTimes(1);
    expect(repository.findPublishedByIds).toHaveBeenCalledWith([serviceId]);
  });

  it('does not disclose a stale public-search hit', async () => {
    elasticsearch.search.mockResolvedValue({
      documents: [publicService],
      total: 1,
    });
    repository.findPublishedByIds.mockResolvedValue([]);

    await expect(
      service.findPublished(new PublicServiceQueryDto()),
    ).resolves.toEqual(expect.objectContaining({ items: [] }));
  });

  it('rejects an inverted public service price range before searching', async () => {
    const query = Object.assign(new PublicServiceQueryDto(), {
      minPriceSatang: 200000,
      maxPriceSatang: 100000,
    });

    await expect(service.findPublished(query)).rejects.toThrow(
      BadRequestException,
    );
    expect(elasticsearch.search).not.toHaveBeenCalled();
  });
});
