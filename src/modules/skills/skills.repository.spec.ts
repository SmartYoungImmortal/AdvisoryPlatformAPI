import type { InferSelectModel } from 'drizzle-orm';
import { runWithLocale } from '@/common/i18n/request-locale';
import type { DrizzleDB } from '@/database/database.module';
import { skillTranslations, type skills } from '@/database/schema';
import { SkillsRepository } from './skills.repository';

type Skill = InferSelectModel<typeof skills>;

const id = '11111111-1111-1111-1111-111111111111';
const actorId = '99999999-9999-9999-9999-999999999999';

/** The row as stored: its own columns hold the Thai source text. */
const thaiRow: Skill = {
  id,
  name: 'การผลิตแบบลีน',
  description: null,
  createdByUserId: null,
  updatedByUserId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  modifiedAt: new Date('2026-01-01T00:00:00Z'),
};

/**
 * Just enough of Drizzle's builder for one transaction: the localized read
 * returns `read`, and every write to the row or to the translation is recorded.
 */
function fakeDb(read: Skill) {
  const writes = {
    rowSets: [] as Record<string, unknown>[],
    translations: [] as Record<string, unknown>[],
  };
  const tx = {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([read]) }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        if (table === skillTranslations) writes.translations.push(values);
        return { onConflictDoUpdate: () => Promise.resolve() };
      },
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        writes.rowSets.push(values);
        return {
          where: () => ({
            returning: () => Promise.resolve([{ ...thaiRow, ...values }]),
          }),
        };
      },
    }),
  };
  const db = {
    transaction: (run: (handle: typeof tx) => Promise<unknown>) => run(tx),
  };
  return {
    repository: new SkillsRepository(db as unknown as DrizzleDB),
    writes,
  };
}

describe('SkillsRepository translations', () => {
  it('leaves the Thai columns alone when the edit is made in English', async () => {
    const { repository, writes } = fakeDb(thaiRow);

    const result = await runWithLocale('en', () =>
      repository.updateLocalized(id, {
        name: 'Lean manufacturing',
        updatedByUserId: actorId,
      }),
    );

    expect(writes.rowSets).toEqual([{ updatedByUserId: actorId }]);
    expect(writes.translations).toEqual([
      {
        skillId: id,
        locale: 'en',
        name: 'Lean manufacturing',
        description: null,
      },
    ]);
    expect(result?.name).toBe('Lean manufacturing');
  });

  it('writes a Thai edit to both the translation and the row', async () => {
    const { repository, writes } = fakeDb(thaiRow);

    await runWithLocale('th', () =>
      repository.updateLocalized(id, {
        description: 'ลดความสูญเปล่าในสายการผลิต',
        updatedByUserId: actorId,
      }),
    );

    expect(writes.rowSets).toEqual([
      {
        updatedByUserId: actorId,
        name: 'การผลิตแบบลีน',
        description: 'ลดความสูญเปล่าในสายการผลิต',
      },
    ]);
    expect(writes.translations).toEqual([
      expect.objectContaining({ skillId: id, locale: 'th' }),
    ]);
  });
});
