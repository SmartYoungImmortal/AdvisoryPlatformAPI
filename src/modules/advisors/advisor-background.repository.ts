import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  advisorCredentials,
  advisorEducations,
  advisorExperiences,
  advisorLanguages,
} from '@/database/schema';
import type {
  AdvisorBackgroundResponseDto,
  CredentialResponse,
  EducationResponse,
  ExperienceResponse,
  LanguageResponse,
} from './dtos/advisor-background.dto';

/** The four lists as they are written: the response's shape, each already in the Advisor's order. */
export type AdvisorBackground = AdvisorBackgroundResponseDto;

/**
 * An Advisor's background (`advisor_experiences`, `_educations`, `_languages`, `_credentials`).
 * Each list is read in the Advisor's order and replaced whole, so a row has no identity worth
 * keeping between saves.
 */
@Injectable()
export class AdvisorBackgroundRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async find(advisorId: string): Promise<AdvisorBackground> {
    const [experiences, educations, languages, credentials] = await Promise.all(
      [
        this.db
          .select({
            title: advisorExperiences.title,
            organization: advisorExperiences.organization,
            startYear: advisorExperiences.startYear,
            startMonth: advisorExperiences.startMonth,
            endYear: advisorExperiences.endYear,
            endMonth: advisorExperiences.endMonth,
            description: advisorExperiences.description,
          })
          .from(advisorExperiences)
          .where(eq(advisorExperiences.advisorId, advisorId))
          .orderBy(asc(advisorExperiences.sortOrder)),
        this.db
          .select({
            institution: advisorEducations.institution,
            degree: advisorEducations.degree,
            startYear: advisorEducations.startYear,
            endYear: advisorEducations.endYear,
          })
          .from(advisorEducations)
          .where(eq(advisorEducations.advisorId, advisorId))
          .orderBy(asc(advisorEducations.sortOrder)),
        this.db
          .select({
            language: advisorLanguages.language,
            proficiency: advisorLanguages.proficiency,
          })
          .from(advisorLanguages)
          .where(eq(advisorLanguages.advisorId, advisorId))
          .orderBy(asc(advisorLanguages.sortOrder)),
        this.db
          .select({
            title: advisorCredentials.title,
            issuer: advisorCredentials.issuer,
            year: advisorCredentials.year,
          })
          .from(advisorCredentials)
          .where(eq(advisorCredentials.advisorId, advisorId))
          .orderBy(asc(advisorCredentials.sortOrder)),
      ],
    );
    return { experiences, educations, languages, credentials };
  }

  /** Every list replaced at once: all of the new background lands, or none of it. */
  async replace(
    advisorId: string,
    background: AdvisorBackground,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await Promise.all([
        tx
          .delete(advisorExperiences)
          .where(eq(advisorExperiences.advisorId, advisorId)),
        tx
          .delete(advisorEducations)
          .where(eq(advisorEducations.advisorId, advisorId)),
        tx
          .delete(advisorLanguages)
          .where(eq(advisorLanguages.advisorId, advisorId)),
        tx
          .delete(advisorCredentials)
          .where(eq(advisorCredentials.advisorId, advisorId)),
      ]);
      // An insert of nothing is an error in SQL, so an empty list is left empty.
      const { experiences, educations, languages, credentials } = background;
      const writes: Promise<unknown>[] = [];
      if (experiences.length > 0)
        writes.push(
          tx.insert(advisorExperiences).values(ordered(advisorId, experiences)),
        );
      if (educations.length > 0)
        writes.push(
          tx.insert(advisorEducations).values(ordered(advisorId, educations)),
        );
      if (languages.length > 0)
        writes.push(
          tx.insert(advisorLanguages).values(ordered(advisorId, languages)),
        );
      if (credentials.length > 0)
        writes.push(
          tx.insert(advisorCredentials).values(ordered(advisorId, credentials)),
        );
      await Promise.all(writes);
    });
  }
}

/** The rows as written: the Advisor's, in the order given. */
function ordered<
  T extends
    | ExperienceResponse
    | EducationResponse
    | LanguageResponse
    | CredentialResponse,
>(
  advisorId: string,
  rows: T[],
): (T & { advisorId: string; sortOrder: number })[] {
  return rows.map((row, sortOrder) => ({ ...row, advisorId, sortOrder }));
}
