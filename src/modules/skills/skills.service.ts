import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { CreateSkillDto } from './dtos/create-skill.dto';
import { SkillQueryDto } from './dtos/skill-query.dto';
import { SkillResponseDto } from './dtos/skill-response.dto';
import { UpdateSkillDto } from './dtos/update-skill.dto';
import { SKILL_MESSAGES } from './skills.constants';
import { SkillsRepository } from './skills.repository';

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepository: SkillsRepository) {}

  async findMany(
    query: SkillQueryDto,
  ): Promise<PaginatedResult<SkillResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.skillsRepository.findManyLocalized(options),
      () => this.skillsRepository.count(),
      (skill) => new SkillResponseDto(skill),
    );
  }

  async findOne(id: string): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.findByIdLocalized(id);

    if (!skill) {
      throw new NotFoundException(SKILL_MESSAGES.notFound);
    }

    return new SkillResponseDto(skill);
  }

  /** `actorId` is the signed-in admin, from the session — never from the body. */
  async create(
    dto: CreateSkillDto,
    actorId: string,
  ): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.createLocalized({
      ...dto,
      createdByUserId: actorId,
      updatedByUserId: actorId,
    });
    return new SkillResponseDto(skill);
  }

  /** In English, the name and description change for English readers only; see `updateLocalized`. */
  async update(
    id: string,
    dto: UpdateSkillDto,
    actorId: string,
  ): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.updateLocalized(id, {
      ...dto,
      updatedByUserId: actorId,
    });

    if (!skill) {
      throw new NotFoundException(SKILL_MESSAGES.notFound);
    }

    return new SkillResponseDto(skill);
  }

  async delete(id: string): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.deleteLocalized(id);

    if (!skill) {
      throw new NotFoundException(SKILL_MESSAGES.notFound);
    }

    return new SkillResponseDto(skill);
  }
}
