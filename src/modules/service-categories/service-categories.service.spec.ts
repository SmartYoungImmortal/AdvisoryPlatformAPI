import { NotFoundException } from '@nestjs/common';
import { InferSelectModel } from 'drizzle-orm';
import { serviceCategories } from '../../database/schema';
import { ServiceCategoryQueryDto } from './dtos/service-category-query.dto';
import { ServiceCategoriesRepository } from './service-categories.repository';
import { ServiceCategoriesService } from './service-categories.service';

type ServiceCategory = InferSelectModel<typeof serviceCategories>;

function makeCategory(
  overrides: Partial<ServiceCategory> = {},
): ServiceCategory {
  return {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Marketing',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('ServiceCategoriesService', () => {
  let service: ServiceCategoriesService;
  let repository: jest.Mocked<
    Pick<
      ServiceCategoriesRepository,
      'findMany' | 'count' | 'findById' | 'create' | 'updateById' | 'deleteById'
    >
  >;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };
    service = new ServiceCategoriesService(
      repository as unknown as ServiceCategoriesRepository,
    );
  });

  describe('findMany', () => {
    it('paginates and maps rows to response DTOs', async () => {
      const query = Object.assign(new ServiceCategoryQueryDto(), {
        page: 1,
        limit: 20,
      });
      repository.findMany.mockResolvedValue([makeCategory()]);
      repository.count.mockResolvedValue(1);

      const result = await service.findMany(query);

      expect(repository.findMany).toHaveBeenCalledWith(undefined, {
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual({
        items: [
          expect.objectContaining({ id: makeCategory().id, name: 'Marketing' }),
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns the mapped category when found', async () => {
      repository.findById.mockResolvedValue(makeCategory());

      const result = await service.findOne(makeCategory().id);

      expect(result.name).toBe('Marketing');
    });

    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns the mapped category', async () => {
      repository.create.mockResolvedValue(makeCategory({ name: 'Legal' }));

      const result = await service.create({ name: 'Legal' });

      expect(repository.create).toHaveBeenCalledWith({ name: 'Legal' });
      expect(result.name).toBe('Legal');
    });
  });

  describe('update', () => {
    it('updates and returns the mapped category', async () => {
      repository.updateById.mockResolvedValue(
        makeCategory({ name: 'Updated' }),
      );

      const result = await service.update(makeCategory().id, {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when the category does not exist', async () => {
      repository.updateById.mockResolvedValue(undefined);

      await expect(service.update('missing-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('resolves when the category was deleted', async () => {
      repository.deleteById.mockResolvedValue(makeCategory());

      await expect(service.delete(makeCategory().id)).resolves.toBeUndefined();
    });

    it('throws NotFoundException when the category does not exist', async () => {
      repository.deleteById.mockResolvedValue(undefined);

      await expect(service.delete('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
