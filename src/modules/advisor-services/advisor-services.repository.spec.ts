import type { InferSelectModel } from 'drizzle-orm';
import { runWithLocale } from '@/common/i18n/request-locale';
import type { DrizzleDB } from '@/database/database.module';
import { serviceTranslations, type services } from '@/database/schema';
import { AdvisorServicesRepository } from './advisor-services.repository';

type AdvisorService = InferSelectModel<typeof services>;

const advisorId = '11111111-1111-1111-1111-111111111111';
const serviceId = '22222222-2222-2222-2222-222222222222';

/** The row as stored: its own columns hold the Thai source text. */
const thaiRow: AdvisorService = {
  id: serviceId,
  advisorId,
  categoryId: '33333333-3333-3333-3333-333333333333',
  availabilityProfileId: '44444444-4444-4444-4444-444444444444',
  name: 'โค้ชอาชีพ',
  description: 'วางแผนอาชีพแบบลงมือทำ',
  priceSatang: 150000,
  durationMinutes: 60,
  dailyConsultationLimitMinutes: null,
  isPublished: true,
  screeningRequired: false,
  trialEnabled: false,
  trialDurationMinutes: null,
  createdAt: new Date('2026-08-29T00:00:00Z'),
  modifiedAt: new Date('2026-08-29T00:00:00Z'),
};

/** The same row as an English reader's localized select returns it. */
const englishRead: AdvisorService = {
  ...thaiRow,
  name: 'Career coaching',
  description: 'Practical career planning',
};

/**
 * Just enough of Drizzle's builder for one transaction: the localized read
 * returns `read`, the row write echoes the stored Thai row with what was set,
 * and every write to the row or to the translation table is recorded.
 */
function fakeDb(read: AdvisorService | undefined) {
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
        if (table === serviceTranslations) {
          writes.translations.push(values);
          return { onConflictDoUpdate: () => Promise.resolve() };
        }
        writes.rowInserts.push(values);
        return {
          returning: () => Promise.resolve([{ ...thaiRow, ...values }]),
        };
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
    ...tx,
    transaction: (run: (handle: typeof tx) => Promise<unknown>) => run(tx),
  };
  return {
    repository: new AdvisorServicesRepository(db as unknown as DrizzleDB),
    writes,
  };
}

/**
 * The write rule from `content-translations.ts`: a Service's name and
 * description go to the translation for the request's language, and to the
 * row's own columns only in Thai; every other field goes to the row as before.
 */
describe('AdvisorServicesRepository translations', () => {
  it('writes a new Service to its own columns and to the translation it was written in', async () => {
    const { repository, writes } = fakeDb(undefined);

    await runWithLocale('en', () =>
      repository.createLocalized({
        advisorId,
        categoryId: thaiRow.categoryId,
        name: 'Career coaching',
        description: 'Practical career planning',
        priceSatang: 150000,
        durationMinutes: 60,
      }),
    );

    expect(writes.rowInserts).toEqual([
      expect.objectContaining({ name: 'Career coaching' }),
    ]);
    expect(writes.translations).toEqual([
      {
        serviceId,
        locale: 'en',
        name: 'Career coaching',
        description: 'Practical career planning',
      },
    ]);
  });

  it('leaves the Thai columns alone when an edit is made in English, but saves the other fields', async () => {
    const { repository, writes } = fakeDb(englishRead);

    const result = await runWithLocale('en', () =>
      repository.updateOwned(advisorId, serviceId, {
        description: 'Career planning you can act on',
        priceSatang: 200000,
        trialEnabled: false,
        trialDurationMinutes: null,
      }),
    );

    expect(writes.rowSets).toEqual([
      { priceSatang: 200000, trialEnabled: false, trialDurationMinutes: null },
    ]);
    expect(writes.translations).toEqual([
      {
        serviceId,
        locale: 'en',
        name: 'Career coaching',
        description: 'Career planning you can act on',
      },
    ]);
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Career coaching',
        description: 'Career planning you can act on',
        priceSatang: 200000,
      }),
    );
  });

  it('writes a Thai edit to both the translation and the row', async () => {
    const { repository, writes } = fakeDb(thaiRow);

    await runWithLocale('th', () =>
      repository.updateOwned(advisorId, serviceId, {
        name: 'โค้ชอาชีพตัวต่อตัว',
        trialEnabled: false,
        trialDurationMinutes: null,
      }),
    );

    expect(writes.rowSets).toEqual([
      expect.objectContaining({
        name: 'โค้ชอาชีพตัวต่อตัว',
        description: 'วางแผนอาชีพแบบลงมือทำ',
      }),
    ]);
    expect(writes.translations).toEqual([
      expect.objectContaining({ locale: 'th', name: 'โค้ชอาชีพตัวต่อตัว' }),
    ]);
  });

  it('writes no translation when an edit changes no text', async () => {
    const { repository, writes } = fakeDb(englishRead);

    const result = await runWithLocale('en', () =>
      repository.updateOwned(advisorId, serviceId, {
        isPublished: false,
        trialEnabled: false,
        trialDurationMinutes: null,
      }),
    );

    expect(writes.translations).toEqual([]);
    expect(result?.name).toBe('Career coaching');
  });

  it('writes nothing to a Service the advisor does not own', async () => {
    const { repository, writes } = fakeDb(undefined);

    await expect(
      repository.updateOwned(advisorId, serviceId, { name: 'Taken over' }),
    ).resolves.toBeUndefined();
    expect(writes.rowSets).toEqual([]);
    expect(writes.translations).toEqual([]);
  });
});
