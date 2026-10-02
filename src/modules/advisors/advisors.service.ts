import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SessionUser } from '@/modules/auth/auth.config';
import {
  paginate,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorOwnProfileResponseDto } from './dtos/advisor-own-profile-response.dto';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { PublicAdvisorQueryDto } from './dtos/public-advisor-query.dto';
import { PublicAdvisorResponseDto } from './dtos/public-advisor-response.dto';
import { UpdateAdvisorProfileDto } from './dtos/update-advisor-profile.dto';
import { AdvisorsRepository } from './advisors.repository';

@Injectable()
export class AdvisorsService {
  constructor(private readonly advisorsRepository: AdvisorsRepository) {}

  async getMe(user: SessionUser): Promise<AdvisorOwnProfileResponseDto> {
    const advisor = await this.advisorsRepository.findByUserId(user.id);
    if (!advisor) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
    return new AdvisorOwnProfileResponseDto(user, advisor);
  }

  async upgrade(
    user: SessionUser,
    dto: CreateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    const advisor = await this.advisorsRepository.createIfAbsent(user.id, dto);
    if (!advisor) {
      throw new ConflictException(ADVISOR_MESSAGES.alreadyExists);
    }

    return new AdvisorOwnProfileResponseDto(user, advisor);
  }

  async updateMe(
    user: SessionUser,
    dto: UpdateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    const advisor = await this.advisorsRepository.updateByUserId(user.id, dto);
    if (!advisor) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
    return new AdvisorOwnProfileResponseDto(user, advisor);
  }

  /* ---------------------------------------------------------------- discovery */

  /**
   * One page of discoverable Advisors, each with their skill names.
   *
   * `paginate` by hand rather than `paginateQuery`, because the skills for a page
   * are one query keyed on the ids that page returned — which is not something a
   * per-row `map` can do without going back to the database once per row.
   */
  async findDiscoverable(
    query: PublicAdvisorQueryDto,
  ): Promise<PaginatedResult<PublicAdvisorResponseDto>> {
    const [rows, total] = await Promise.all([
      this.advisorsRepository.findDiscoverable(query, {
        limit: query.limit,
        offset: query.offset,
      }),
      this.advisorsRepository.countDiscoverable(query),
    ]);

    const skillsByAdvisor = await this.groupSkills(rows.map((row) => row.id));

    return paginate(
      rows.map(
        (row) =>
          new PublicAdvisorResponseDto({
            ...row,
            skills: skillsByAdvisor.get(row.id) ?? [],
          }),
      ),
      total,
      query,
    );
  }

  /**
   * One discoverable Advisor.
   *
   * An Advisor who exists but is not discoverable — suspended, banned, or with
   * nothing published — is a 404 rather than an empty profile, so the route cannot
   * be used to confirm that a given account exists.
   */
  async findDiscoverableById(
    advisorId: string,
  ): Promise<PublicAdvisorResponseDto> {
    const row = await this.advisorsRepository.findDiscoverableById(advisorId);
    if (!row) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
    const skillsByAdvisor = await this.groupSkills([row.id]);
    return new PublicAdvisorResponseDto({
      ...row,
      skills: skillsByAdvisor.get(row.id) ?? [],
    });
  }

  private async groupSkills(
    advisorIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    const rows = await this.advisorsRepository.findSkillNamesFor(advisorIds);
    const grouped = new Map<string, string[]>();
    for (const { advisorId, name } of rows) {
      const names = grouped.get(advisorId);
      if (names) names.push(name);
      else grouped.set(advisorId, [name]);
    }
    return grouped;
  }
}
