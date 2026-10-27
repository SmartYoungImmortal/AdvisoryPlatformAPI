import { Inject, Injectable } from '@nestjs/common';
import {
  asc,
  eq,
  getTableColumns,
  type InferInsertModel,
  type InferSelectModel,
} from 'drizzle-orm';
import {
  saveSkillTranslation,
  writesSourceText,
} from '@/common/i18n/content-translations';
import { skillDescription, skillName } from '@/common/i18n/localized-columns';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { skills } from '@/database/schema';

type Skill = InferSelectModel<typeof skills>;
type Reader = Pick<DrizzleDB, 'select'>;

/** An admin's edit: either text field, in the request's language, and who made it. */
export interface SkillEdit {
  name?: string;
  description?: string | null;
  updatedByUserId: string;
}

/**
 * Every column of a skill, its name and description in the request's language.
 * A function, not a constant: the language is the request's, so it is read when
 * each query is built.
 */
const localizedColumns = () => ({
  ...getTableColumns(skills),
  name: skillName(),
  description: skillDescription(),
});

/**
 * Skills as a reader sees them: every read returns the name and description in
 * the request's language, and every write follows the rule in
 * `content-translations.ts`.
 */
@Injectable()
export class SkillsRepository extends EntityRepository<typeof skills> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, skills);
  }

  /** A page of skills, in the same id order as the inherited `findMany`. */
  findManyLocalized(options: {
    limit: number;
    offset: number;
  }): Promise<Skill[]> {
    return this.db
      .select(localizedColumns())
      .from(skills)
      .orderBy(asc(skills.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  async findByIdLocalized(
    id: string,
    db: Reader = this.db,
  ): Promise<Skill | undefined> {
    const [skill] = await db
      .select(localizedColumns())
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);
    return skill;
  }

  /**
   * A new skill, its text written twice in one transaction: to the row's own
   * columns, the fallback for a language with no translation, and to the
   * translation for the language it was written in.
   */
  createLocalized(values: InferInsertModel<typeof skills>): Promise<Skill> {
    return this.db.transaction(async (tx) => {
      const [skill] = await tx.insert(skills).values(values).returning();
      await saveSkillTranslation(tx, skill.id, {
        name: skill.name,
        description: skill.description,
      });
      return skill;
    });
  }

  /**
   * An edit's text goes to the translation for the request's language, merged
   * over what that language reads now so a partial edit keeps the other field.
   * The row's own columns take it only in Thai, the source: an edit made in
   * English leaves the Thai as it was. Who made the edit goes to the row either
   * way. Returns the skill as the request's language now reads it.
   */
  updateLocalized(
    id: string,
    { name, description, ...values }: SkillEdit,
  ): Promise<Skill | undefined> {
    return this.db.transaction(async (tx) => {
      const current = await this.findByIdLocalized(id, tx);
      if (!current) return undefined;

      const edited = name !== undefined || description !== undefined;
      const text = {
        name: name ?? current.name,
        description:
          description === undefined ? current.description : description,
      };
      const [skill] = await tx
        .update(skills)
        .set(edited && writesSourceText() ? { ...values, ...text } : values)
        .where(eq(skills.id, id))
        .returning();
      if (!skill) return undefined;
      if (edited) await saveSkillTranslation(tx, id, text);
      return { ...skill, ...text };
    });
  }

  /**
   * Read before it goes, so the response is in the request's language: the
   * translations are deleted with the row (the foreign key cascades).
   */
  deleteLocalized(id: string): Promise<Skill | undefined> {
    return this.db.transaction(async (tx) => {
      const skill = await this.findByIdLocalized(id, tx);
      if (!skill) return undefined;
      const deleted = await tx
        .delete(skills)
        .where(eq(skills.id, id))
        .returning({ id: skills.id });
      return deleted.length > 0 ? skill : undefined;
    });
  }
}
