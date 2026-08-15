import { NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { skills } from '../../database/schema';
import { SkillQueryDto } from './dtos/skill-query.dto';
import type { SkillsRepository } from './skills.repository';
import { SkillsService } from './skills.service';

type Skill = InferSelectModel<typeof skills>;

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Lean manufacturing',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    modifiedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('SkillsService', () => {
  let service: SkillsService;
  let repository: jest.Mocked<
    Pick<
      SkillsRepository,
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
    service = new SkillsService(repository as unknown as SkillsRepository);
  });

  describe('findMany', () => {
    it('paginates and maps rows to response DTOs', async () => {
      const query = Object.assign(new SkillQueryDto(), { page: 2, limit: 10 });
      repository.findMany.mockResolvedValue([makeSkill()]);
      repository.count.mockResolvedValue(11);

      const result = await service.findMany(query);

      expect(repository.findMany).toHaveBeenCalledWith(undefined, {
        limit: 10,
        offset: 10,
      });
      expect(result).toEqual({
        items: [
          expect.objectContaining({
            id: makeSkill().id,
            name: 'Lean manufacturing',
          }),
        ],
        total: 11,
        page: 2,
        limit: 10,
        totalPages: 2,
      });
    });
  });

  describe('findOne', () => {
    it('returns the mapped skill when found', async () => {
      repository.findById.mockResolvedValue(makeSkill());

      const result = await service.findOne(makeSkill().id);

      expect(result.name).toBe('Lean manufacturing');
    });

    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns the mapped skill', async () => {
      repository.create.mockResolvedValue(makeSkill({ name: 'New skill' }));

      const result = await service.create({ name: 'New skill' });

      expect(repository.create).toHaveBeenCalledWith({ name: 'New skill' });
      expect(result.name).toBe('New skill');
    });
  });

  describe('update', () => {
    it('updates and returns the mapped skill', async () => {
      repository.updateById.mockResolvedValue(makeSkill({ name: 'Updated' }));

      const result = await service.update(makeSkill().id, { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when the skill does not exist', async () => {
      repository.updateById.mockResolvedValue(undefined);

      await expect(service.update('missing-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('resolves when the skill was deleted', async () => {
      repository.deleteById.mockResolvedValue(makeSkill());

      await expect(service.delete(makeSkill().id)).resolves.toBeUndefined();
    });

    it('throws NotFoundException when the skill does not exist', async () => {
      repository.deleteById.mockResolvedValue(undefined);

      await expect(service.delete('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
