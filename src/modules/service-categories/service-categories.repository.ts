import { Inject, Injectable } from '@nestjs/common';
import {
  asc,
  eq,
  getTableColumns,
  type InferInsertModel,
  type InferSelectModel,
} from 'drizzle-orm';
import {
  saveCategoryTranslation,
  writesSourceText,
} from '@/common/i18n/content-translations';
import {
  categoryDescription,
  categoryName,
} from '@/common/i18n/localized-columns';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { serviceCategories } from '@/database/schema';

type ServiceCategory = InferSelectModel<typeof serviceCategories>;
type Reader = Pick<DrizzleDB, 'select'>;

/** An admin's edit: either text field, in the request's language, and who made it. */
export interface ServiceCategoryEdit {
  name?: string;
  description?: string | null;
  updatedByUserId: string;
}

/**
 * Every column of a category, its name and description in the request's
 * language. A function, not a constant: the language is the request's, so it is
 * read when each query is built.
 */
const localizedColumns = () => ({
  ...getTableColumns(serviceCategories),
  name: categoryName(),
  description: categoryDescription(),
});

/**
 * Categories as a reader sees them: every read returns the name and description
 * in the request's language, and every write follows the rule in
 * `content-translations.ts`.
 */
@Injectable()
export class ServiceCategoriesRepository extends EntityRepository<
  typeof serviceCategories
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, serviceCategories);
  }

  /** A page of categories, in the same id order as the inherited `findMany`. */
  findManyLocalized(options: {
    limit: number;
    offset: number;
  }): Promise<ServiceCategory[]> {
    return this.db
      .select(localizedColumns())
      .from(serviceCategories)
      .orderBy(asc(serviceCategories.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  async findByIdLocalized(
    id: string,
    db: Reader = this.db,
  ): Promise<ServiceCategory | undefined> {
    const [category] = await db
      .select(localizedColumns())
      .from(serviceCategories)
      .where(eq(serviceCategories.id, id))
      .limit(1);
    return category;
  }

  /**
   * A new category, its text written twice in one transaction: to the row's own
   * columns, the fallback for a language with no translation, and to the
   * translation for the language it was written in.
   */
  createLocalized(
    values: InferInsertModel<typeof serviceCategories>,
  ): Promise<ServiceCategory> {
    return this.db.transaction(async (tx) => {
      const [category] = await tx
        .insert(serviceCategories)
        .values(values)
        .returning();
      await saveCategoryTranslation(tx, category.id, {
        name: category.name,
        description: category.description,
      });
      return category;
    });
  }

  /**
   * An edit's text goes to the translation for the request's language, merged
   * over what that language reads now so a partial edit keeps the other field.
   * The row's own columns take it only in Thai, the source: an edit made in
   * English leaves the Thai as it was. Who made the edit goes to the row either
   * way. Returns the category as the request's language now reads it.
   */
  updateLocalized(
    id: string,
    { name, description, ...values }: ServiceCategoryEdit,
  ): Promise<ServiceCategory | undefined> {
    return this.db.transaction(async (tx) => {
      const current = await this.findByIdLocalized(id, tx);
      if (!current) return undefined;

      const edited = name !== undefined || description !== undefined;
      const text = {
        name: name ?? current.name,
        description:
          description === undefined ? current.description : description,
      };
      const [category] = await tx
        .update(serviceCategories)
        .set(edited && writesSourceText() ? { ...values, ...text } : values)
        .where(eq(serviceCategories.id, id))
        .returning();
      if (!category) return undefined;
      if (edited) await saveCategoryTranslation(tx, id, text);
      return { ...category, ...text };
    });
  }

  /**
   * Read before it goes, so the response is in the request's language: the
   * translations are deleted with the row (the foreign key cascades).
   */
  deleteLocalized(id: string): Promise<ServiceCategory | undefined> {
    return this.db.transaction(async (tx) => {
      const category = await this.findByIdLocalized(id, tx);
      if (!category) return undefined;
      const deleted = await tx
        .delete(serviceCategories)
        .where(eq(serviceCategories.id, id))
        .returning({ id: serviceCategories.id });
      return deleted.length > 0 ? category : undefined;
    });
  }
}
