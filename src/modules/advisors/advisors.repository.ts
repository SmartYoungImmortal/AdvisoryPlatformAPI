import { Inject, Injectable } from '@nestjs/common';
import {
  InferSelectModel,
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  advisorGlobalAvailability,
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

/** A discoverable Advisor, before skill names are attached. */
export interface PublicAdvisorRow {
  id: string;
  displayName: string;
  headline: string;
  bio: string | null;
  avatarKey: string | null;
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

  async findByUserId(userId: string): Promise<AdvisorProfile | undefined> {
    const [advisor] = await this.db
      .select()
      .from(advisorProfiles)
      .where(eq(advisorProfiles.userId, userId))
      .limit(1);
    return advisor;
  }

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

      await tx
        .insert(advisorGlobalAvailability)
        .values({ advisorId: userId })
        .onConflictDoNothing();

      await tx
        .update(userSchema)
        .set({ role: 'advisor' })
        .where(eq(userSchema.id, userId));

      return advisor;
    });

    return advisor;
  }

  async updateByUserId(
    userId: string,
    dto: UpdateAdvisorProfileDto,
  ): Promise<AdvisorProfile | undefined> {
    const [advisor] = await this.db
      .update(advisorProfiles)
      .set({ ...dto, modifiedAt: new Date() })
      .where(eq(advisorProfiles.userId, userId))
      .returning();
    return advisor;
  }

  /* ---------------------------------------------------------------- discovery */

  /**
   * Who is discoverable: an Advisor with a profile, an active unbanned account,
   * and at least one published service.
   *
   * The last clause is the one worth stating. An Advisor with nothing on sale is
   * not a listing, and leaving them in produces rows a visitor cannot act on. It
   * is an `exists` subquery rather than a join so that an Advisor with six
   * services is still one row.
   */
  private discoverableWhere(query?: PublicAdvisorQueryDto): SQL {
    const text = query?.q?.trim();
    const pattern = text
      ? `%${text.replace(/[\\%_]/g, (match) => `\\${match}`)}%`
      : undefined;

    return and(
      eq(userSchema.status, 'ACTIVE'),
      eq(userSchema.banned, false),
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
            ilike(advisorProfiles.headline, pattern),
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
    return this.selectDiscoverable()
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
    return this.db
      .select({ advisorId: advisorSkills.advisorId, name: skills.name })
      .from(advisorSkills)
      .innerJoin(skills, eq(skills.id, advisorSkills.skillId))
      .where(inArray(advisorSkills.advisorId, [...advisorIds]))
      .orderBy(asc(skills.name));
  }

  private selectDiscoverable() {
    return this.db
      .select({
        id: advisorProfiles.userId,
        displayName: userSchema.displayName,
        headline: advisorProfiles.headline,
        bio: advisorProfiles.bio,
        avatarKey: userSchema.avatarKey,
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
