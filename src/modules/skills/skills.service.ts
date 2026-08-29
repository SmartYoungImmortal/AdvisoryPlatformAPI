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
      (options) => this.skillsRepository.findMany(undefined, options),
      () => this.skillsRepository.count(),
      (skill) => new SkillResponseDto(skill),
    );
  }

  async findOne(id: string): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.findById(id);

    if (!skill) {
      throw new NotFoundException(SKILL_MESSAGES.notFound);
    }

    return new SkillResponseDto(skill);
  }

  async create(dto: CreateSkillDto): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.create(dto);
    return new SkillResponseDto(skill);
  }

  async update(id: string, dto: UpdateSkillDto): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.updateById(id, dto);

    if (!skill) {
      throw new NotFoundException(SKILL_MESSAGES.notFound);
    }

    return new SkillResponseDto(skill);
  }

  async delete(id: string): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.deleteById(id);

    if (!skill) {
      throw new NotFoundException(SKILL_MESSAGES.notFound);
    }

    return new SkillResponseDto(skill);
  }
}
