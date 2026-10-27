import type { InferSelectModel } from 'drizzle-orm';
import { runWithLocale } from '@/common/i18n/request-locale';
import type { DrizzleDB } from '@/database/database.module';
import {
  serviceCategoryTranslations,
  type serviceCategories,
} from '@/database/schema';
import { ServiceCategoriesRepository } from './service-categories.repository';

type ServiceCategory = InferSelectModel<typeof serviceCategories>;

const id = '22222222-2222-2222-2222-222222222222';
const actorId = '99999999-9999-9999-9999-999999999999';

/** The row as stored: its own columns hold the Thai source text. */
const thaiRow: ServiceCategory = {
  id,
  name: 'การตลาด',
  description: 'แคมเปญและโฆษณา',
  createdByUserId: null,
  updatedByUserId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  modifiedAt: new Date('2026-01-01T00:00:00Z'),
};

/** The same row as an English reader's localized select returns it. */
const englishRead: ServiceCategory = {
  ...thaiRow,
  name: 'Marketing',
  description: 'Campaigns and ads',
};

/**
 * Just enough of Drizzle's builder for one transaction: the localized read
 * returns `read`, the row write echoes `stored` with what was set, and every
 * write to the row or to the translation table is recorded.
 */
function fakeDb(read: ServiceCategory | undefined, stored = thaiRow) {
  const writes = {
    rowInserts: [] as Record<string, unknown>[],
    rowSets: [] as Record<string, unknown>[],
    translations: [] as Record<string, unknown>[],
  };
  const tx = {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(read ? [read] : []) }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        if (table === serviceCategoryTranslations) {
          writes.translations.push(values);
          return { onConflictDoUpdate: () => Promise.resolve() };
        }
        writes.rowInserts.push(values);
        return { returning: () => Promise.resolve([{ ...stored, ...values }]) };
      },
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        writes.rowSets.push(values);
        return {
          where: () => ({
            returning: () => Promise.resolve([{ ...stored, ...values }]),
          }),
        };
      },
    }),
    delete: () => ({
      where: () => ({ returning: () => Promise.resolve([{ id }]) }),
    }),
  };
  const db = {
    ...tx,
    transaction: (run: (handle: typeof tx) => Promise<unknown>) => run(tx),
  };
  return {
    repository: new ServiceCategoriesRepository(db as unknown as DrizzleDB),
    writes,
  };
}

/**
 * The write rule from `content-translations.ts`: text goes to the translation
 * for the request's language, and to the row's own columns only in Thai.
 */
describe('ServiceCategoriesRepository translations', () => {
  it('writes a new category to its own columns and to the translation it was written in', async () => {
    const { repository, writes } = fakeDb(undefined);

    await runWithLocale('en', () =>
      repository.createLocalized({
        name: 'Marketing',
        description: 'Campaigns and ads',
        createdByUserId: actorId,
        updatedByUserId: actorId,
      }),
    );

    expect(writes.rowInserts).toEqual([
      expect.objectContaining({
        name: 'Marketing',
        description: 'Campaigns and ads',
      }),
    ]);
    expect(writes.translations).toEqual([
      {
        categoryId: id,
        locale: 'en',
        name: 'Marketing',
        description: 'Campaigns and ads',
      },
    ]);
  });

  it('leaves the Thai columns alone when the edit is made in English', async () => {
    const { repository, writes } = fakeDb(englishRead);

    const result = await runWithLocale('en', () =>
      repository.updateLocalized(id, {
        name: 'Digital marketing',
        updatedByUserId: actorId,
      }),
    );

    expect(writes.rowSets).toEqual([{ updatedByUserId: actorId }]);
    // The description is merged in from what English reads now.
    expect(writes.translations).toEqual([
      {
        categoryId: id,
        locale: 'en',
        name: 'Digital marketing',
        description: 'Campaigns and ads',
      },
    ]);
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Digital marketing',
        description: 'Campaigns and ads',
      }),
    );
  });

  it('writes a Thai edit to both the translation and the row', async () => {
    const { repository, writes } = fakeDb(thaiRow);

    await runWithLocale('th', () =>
      repository.updateLocalized(id, {
        description: 'กลยุทธ์การตลาด',
        updatedByUserId: actorId,
      }),
    );

    expect(writes.rowSets).toEqual([
      {
        updatedByUserId: actorId,
        name: 'การตลาด',
        description: 'กลยุทธ์การตลาด',
      },
    ]);
    expect(writes.translations).toEqual([
      {
        categoryId: id,
        locale: 'th',
        name: 'การตลาด',
        description: 'กลยุทธ์การตลาด',
      },
    ]);
  });

  it('clears a description sent as null rather than keeping the old one', async () => {
    const { repository, writes } = fakeDb(englishRead);

    await runWithLocale('en', () =>
      repository.updateLocalized(id, {
        description: null,
        updatedByUserId: actorId,
      }),
    );

    expect(writes.translations).toEqual([
      expect.objectContaining({ name: 'Marketing', description: null }),
    ]);
  });

  it('writes no translation for an edit without text, and still returns the localized text', async () => {
    const { repository, writes } = fakeDb(englishRead);

    const result = await runWithLocale('en', () =>
      repository.updateLocalized(id, { updatedByUserId: actorId }),
    );

    expect(writes.translations).toEqual([]);
    expect(result?.name).toBe('Marketing');
  });

  it('writes nothing for a category that does not exist', async () => {
    const { repository, writes } = fakeDb(undefined);

    await expect(
      repository.updateLocalized(id, { name: 'X', updatedByUserId: actorId }),
    ).resolves.toBeUndefined();
    expect(writes.rowSets).toEqual([]);
    expect(writes.translations).toEqual([]);
  });

  it('returns a deleted category as the request language read it', async () => {
    const { repository } = fakeDb(englishRead);

    await expect(
      runWithLocale('en', () => repository.deleteLocalized(id)),
    ).resolves.toEqual(expect.objectContaining({ name: 'Marketing' }));
  });
});
