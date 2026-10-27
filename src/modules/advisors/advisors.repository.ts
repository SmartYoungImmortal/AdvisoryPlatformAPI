import { Inject, Injectable } from '@nestjs/common';
import {
  InferSelectModel,
  and,
  asc,
  count,
  eq,
  exists,
  getColumns,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { isVerifiedAdvisor } from '@/common/authorization/verified-advisor.predicate';
import {
  saveAdvisorProfileTranslation,
  writesSourceText,
} from '@/common/i18n/content-translations';
import {
  advisorBio,
  advisorHeadline,
  skillName,
} from '@/common/i18n/localized-columns';
import { escapeLike } from '@/common/utils/escape-like';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  advisorGlobalAvailability,
  advisorIdentity,
  advisorProfiles,
  advisorSkills,
  services,
  skills,
  user as userSchema,
} from '@/database/schema';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { PublicAdvisorQueryDto } from './dtos/public-advisor-query.dto';
import { UpdateAdvisorProfileDto } from './dtos/update-advisor-profile.dto';

type AdvisorProfile = InferSelectModel<typeof advisorProfiles>;
type IdentityVerificationStatus = InferSelectModel<
  typeof advisorIdentity
>['verificationStatus'];

/** A discoverable Advisor, before skill names are attached. */
export interface PublicAdvisorRow {
  id: string;
  displayName: string;
  headline: string;
  bio: string | null;
  avatarKey: string | null;
  image: string | null;
  publishedServiceCount: number;
}

/**
 * Not an `EntityRepository` — `advisorProfiles`'s PK is `userId` (a 1:1 extension of
 * `user`, per docs/ER.README.md's no-surrogate-id list), so it has no `id` column for
 * the generic base to key off of.
 */
@Injectable()
export class AdvisorsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** The profile, its headline and bio in the request's language. */
  async findByUserId(userId: string): Promise<AdvisorProfile | undefined> {
    const [advisor] = await this.db
      .select({
        ...getColumns(advisorProfiles),
        headline: advisorHeadline(),
        bio: advisorBio(),
      })
      .from(advisorProfiles)
      .where(eq(advisorProfiles.userId, userId))
      .limit(1);
    return advisor;
  }

  /**
   * Where the applicant's identity review stands. No `advisor_identity` row means
   * nothing has been submitted yet, which is `NONE` in the status vocabulary.
   */
  async findVerificationStatus(
    userId: string,
  ): Promise<IdentityVerificationStatus> {
    const [row] = await this.db
      .select({ status: advisorIdentity.verificationStatus })
      .from(advisorIdentity)
      .where(eq(advisorIdentity.advisorId, userId))
      .limit(1);
    return row?.status ?? 'NONE';
  }

  /**
   * Opens an application. The profile and default availability are created now so
   * the applicant has something to attach documents to, but `user.role` is left
   * alone: it becomes `advisor` only when an admin approves the identity.
   */
  async createIfAbsent(
    userId: string,
    dto: CreateAdvisorProfileDto,
  ): Promise<AdvisorProfile | undefined> {
    const advisor = await this.db.transaction(async (tx) => {
      const [advisor] = await tx
        .insert(advisorProfiles)
        .values({ userId, ...dto })
        .onConflictDoNothing()
        .returning();

      // The text is also the translation for the language it was written in;
      // the profile's own columns are the fallback for any other.
      if (advisor) {
        await saveAdvisorProfileTranslation(tx, userId, {
          headline: advisor.headline,
          bio: advisor.bio,
        });
      }

      await tx
        .insert(advisorGlobalAvailability)
        .values({ advisorId: userId })
        .onConflictDoNothing();

      return advisor;
    });

    return advisor;
  }

  /**
   * Edits the headline and bio in the request's language: that language's
   * translation row, with the current text kept for a field left out. The
   * profile's own columns change only in Thai, the source, so an English edit
   * leaves the Thai as it was. Returns the profile as that language reads it.
   */
  async updateByUserId(
    userId: string,
    dto: UpdateAdvisorProfileDto,
  ): Promise<AdvisorProfile | undefined> {
    return await this.db.transaction(async (tx) => {
      // Locked, so two partial edits at once cannot each merge over stale text.
      const [current] = await tx
        .select({ headline: advisorHeadline(), bio: advisorBio() })
        .from(advisorProfiles)
        .where(eq(advisorProfiles.userId, userId))
        .for('update');
      if (!current) return undefined;

      const edited = dto.headline !== undefined || dto.bio !== undefined;
      const text = {
        headline: dto.headline ?? current.headline,
        bio: dto.bio === undefined ? current.bio : dto.bio,
      };
      const [advisor] = await tx
        .update(advisorProfiles)
        .set({
          ...(edited && writesSourceText() ? text : {}),
          modifiedAt: new Date(),
        })
        .where(eq(advisorProfiles.userId, userId))
        .returning();
      // An empty edit writes no translation: it would copy the fallback text
      // into a language it was never written in.
      if (edited) {
        await saveAdvisorProfileTranslation(tx, userId, text);
      }
      return { ...advisor, ...text };
    });
  }

  /* ---------------------------------------------------------------- discovery */

  /**
   * Who is discoverable: an Advisor with a profile, a verified identity, an active
   * unbanned account, and at least one published service.
   *
   * The identity clause keeps applicants out: they have a profile from the moment
   * they apply, but they are not Advisors until an admin approves them.
   *
   * The last clause is the one worth stating. An Advisor with nothing on sale is
   * not a listing, and leaving them in produces rows a visitor cannot act on. It
   * is an `exists` subquery rather than a join so that an Advisor with six
   * services is still one row.
   *
   * The text search matches the headline the reader sees, in their language.
   */
  private discoverableWhere(query?: PublicAdvisorQueryDto): SQL {
    const text = query?.q?.trim();
    const pattern = text ? `%${escapeLike(text)}%` : undefined;

    return and(
      eq(userSchema.status, 'ACTIVE'),
      eq(userSchema.banned, false),
      isVerifiedAdvisor(advisorProfiles.userId),
      exists(
        this.db
          .select({ one: sql`1` })
          .from(services)
          .where(
            and(
              eq(services.advisorId, advisorProfiles.userId),
              eq(services.isPublished, true),
            ),
          ),
      ),
      pattern
        ? or(
            ilike(userSchema.displayName, pattern),
            ilike(advisorHeadline(), pattern),
          )
        : undefined,
      query?.skillId
        ? exists(
            this.db
              .select({ one: sql`1` })
              .from(advisorSkills)
              .where(
                and(
                  eq(advisorSkills.advisorId, advisorProfiles.userId),
                  eq(advisorSkills.skillId, query.skillId),
                ),
              ),
          )
        : undefined,
    ) as SQL;
  }

  /**
   * Counted over the same joins and predicate the page uses.
   *
   * Written out rather than reusing a generic count: the predicate reads columns
   * from `user` as well as `advisor_profiles`, and a count that selected from one
   * table alone would emit a WHERE naming a table absent from its FROM — the exact
   * shape that made `GET /services` answer 500 for every request.
   */
  async countDiscoverable(query: PublicAdvisorQueryDto): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(advisorProfiles)
      .innerJoin(userSchema, eq(userSchema.id, advisorProfiles.userId))
      .where(this.discoverableWhere(query));
    return row?.value ?? 0;
  }

  /** One page of discoverable Advisors, oldest profile first so paging is stable. */
  async findDiscoverable(
    query: PublicAdvisorQueryDto,
    options: { limit: number; offset: number },
  ): Promise<PublicAdvisorRow[]> {
    return await this.selectDiscoverable()
      .where(this.discoverableWhere(query))
      .orderBy(asc(advisorProfiles.createdAt), asc(advisorProfiles.userId))
      .limit(options.limit)
      .offset(options.offset);
  }

  /** One discoverable Advisor, or nothing — an unlisted one must 404, not leak. */
  async findDiscoverableById(
    advisorId: string,
  ): Promise<PublicAdvisorRow | undefined> {
    const [advisor] = await this.selectDiscoverable()
      .where(
        and(this.discoverableWhere(), eq(advisorProfiles.userId, advisorId)),
      )
      .limit(1);
    return advisor;
  }

  /**
   * The skill names for a set of Advisors, in one query rather than one per row.
   *
   * Returned as a flat list for the caller to group. Aggregating in SQL would mean
   * a `json_agg` whose type Drizzle cannot infer as cleanly as this, and the set
   * is one page wide.
   */
  async findSkillNamesFor(
    advisorIds: readonly string[],
  ): Promise<{ advisorId: string; name: string }[]> {
    if (advisorIds.length === 0) return [];
    const name = skillName();
    return await this.db
      .select({ advisorId: advisorSkills.advisorId, name })
      .from(advisorSkills)
      .innerJoin(skills, eq(skills.id, advisorSkills.skillId))
      .where(inArray(advisorSkills.advisorId, [...advisorIds]))
      .orderBy(asc(name));
  }

  private selectDiscoverable() {
    return this.db
      .select({
        id: advisorProfiles.userId,
        displayName: userSchema.displayName,
        headline: advisorHeadline(),
        bio: advisorBio(),
        avatarKey: userSchema.avatarKey,
        image: userSchema.image,
        publishedServiceCount: sql<number>`(
          select count(*)::int from ${services}
          where ${services.advisorId} = ${advisorProfiles.userId}
            and ${services.isPublished} = true
        )`,
      })
      .from(advisorProfiles)
      .innerJoin(userSchema, eq(userSchema.id, advisorProfiles.userId));
  }
}
