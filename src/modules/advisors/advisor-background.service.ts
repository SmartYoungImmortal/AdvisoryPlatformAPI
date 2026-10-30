import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorsRepository } from './advisors.repository';
import {
  AdvisorBackgroundRepository,
  type AdvisorBackground,
} from './advisor-background.repository';
import type {
  AdvisorBackgroundResponseDto,
  ReplaceAdvisorBackgroundDto,
} from './dtos/advisor-background.dto';

/**
 * An Advisor's background: read by anyone on a discoverable Advisor's public profile, and read
 * and replaced by the Advisor from their own profile editor.
 */
@Injectable()
export class AdvisorBackgroundService {
  constructor(
    private readonly background: AdvisorBackgroundRepository,
    private readonly advisors: AdvisorsRepository,
  ) {}

  /**
   * A discoverable Advisor's background. One that is not discoverable is a 404, as their profile
   * is (`AdvisorsService.findDiscoverableById`), so the route confirms nothing about them.
   */
  async findPublic(advisorId: string): Promise<AdvisorBackgroundResponseDto> {
    if (!(await this.advisors.findDiscoverableById(advisorId))) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
    return this.background.find(advisorId);
  }

  async findMine(user: SessionUser): Promise<AdvisorBackgroundResponseDto> {
    await this.ownProfile(user);
    return this.background.find(user.id);
  }

  /** Replaces every list, then answers what was stored. */
  async replaceMine(
    user: SessionUser,
    dto: ReplaceAdvisorBackgroundDto,
  ): Promise<AdvisorBackgroundResponseDto> {
    await this.ownProfile(user);
    const background = normalize(dto);
    await this.background.replace(user.id, background);
    return this.background.find(user.id);
  }

  private async ownProfile(user: SessionUser): Promise<void> {
    if (!(await this.advisors.findByUserId(user.id))) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
  }
}

/** An optional line left blank is no line at all. */
function blankToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

/**
 * The lists as stored: optional fields null rather than missing or blank, and each job's and
 * course's dates in order, which the tables also check; a 400 here says which entry is wrong
 * where the database would only refuse the save.
 */
function normalize(dto: ReplaceAdvisorBackgroundDto): AdvisorBackground {
  const experiences = dto.experiences.map((entry, index) => {
    const endYear = entry.endYear ?? null;
    const startMonth = entry.startMonth ?? null;
    const endMonth = endYear === null ? null : (entry.endMonth ?? null);
    const endsBefore =
      endYear !== null &&
      (endYear < entry.startYear ||
        (endYear === entry.startYear &&
          startMonth !== null &&
          endMonth !== null &&
          endMonth < startMonth));
    if (endsBefore) {
      throw new BadRequestException(
        `${ADVISOR_MESSAGES.backgroundEndsBeforeStart} (experiences[${index}])`,
      );
    }
    return {
      title: entry.title,
      organization: entry.organization,
      startYear: entry.startYear,
      startMonth,
      endYear,
      endMonth,
      description: blankToNull(entry.description),
    };
  });
  const educations = dto.educations.map((entry, index) => {
    const startYear = entry.startYear ?? null;
    const endYear = entry.endYear ?? null;
    if (startYear !== null && endYear !== null && endYear < startYear) {
      throw new BadRequestException(
        `${ADVISOR_MESSAGES.backgroundEndsBeforeStart} (educations[${index}])`,
      );
    }
    return {
      institution: entry.institution,
      degree: blankToNull(entry.degree),
      startYear,
      endYear,
    };
  });
  return {
    experiences,
    educations,
    languages: dto.languages.map(({ language, proficiency }) => ({
      language,
      proficiency,
    })),
    credentials: dto.credentials.map((entry) => ({
      title: entry.title,
      issuer: blankToNull(entry.issuer),
      year: entry.year ?? null,
    })),
  };
}
