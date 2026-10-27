import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { runWithLocale } from '@/common/i18n/request-locale';
import type { DrizzleDB } from '@/database/database.module';
import {
  advisorGlobalAvailability,
  advisorIdentity,
  advisorProfileTranslations,
  advisorProfiles,
  serviceCategories,
  services,
  user,
} from '@/database/schema';
import { PublicAdvisorQueryDto } from './dtos/public-advisor-query.dto';
import { AdvisorsRepository } from './advisors.repository';

/**
 * The headline and bio are read and written through their translation rows, with the profile's
 * own columns as the Thai source and the fallback. These run against real Postgres because the
 * localized text is a correlated subquery and an edit is a locked read, merge and write.
 *
 * The tests run in order: each one starts from the text the one before it left.
 */
describe('AdvisorsRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: AdvisorsRepository;
  let setupComplete = false;

  const advisorId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();
  // In the English headline only, so a search for it tells the two languages apart.
  const tag = advisorId.slice(0, 8);

  const translations = () =>
    db
      .select({
        locale: advisorProfileTranslations.locale,
        headline: advisorProfileTranslations.headline,
        bio: advisorProfileTranslations.bio,
      })
      .from(advisorProfileTranslations)
      .where(eq(advisorProfileTranslations.advisorId, advisorId))
      .orderBy(asc(advisorProfileTranslations.locale));

  const sourceText = async () => {
    const [row] = await db
      .select({ headline: advisorProfiles.headline, bio: advisorProfiles.bio })
      .from(advisorProfiles)
      .where(eq(advisorProfiles.userId, advisorId));
    return row;
  };

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new AdvisorsRepository(db);

    await db.insert(user).values({
      id: advisorId,
      email: `${advisorId}@advisors.example.test`,
      displayName: 'Advisors test',
      fullName: 'Advisors Test',
      timezone: 'Asia/Bangkok',
    });
    await db
      .insert(serviceCategories)
      .values({ id: categoryId, name: `Advisors test ${categoryId}` });
    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await pool?.end();
      return;
    }
    await db.delete(services).where(eq(services.id, serviceId));
    await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId));
    await db
      .delete(advisorIdentity)
      .where(eq(advisorIdentity.advisorId, advisorId));
    await db
      .delete(advisorGlobalAvailability)
      .where(eq(advisorGlobalAvailability.advisorId, advisorId));
    // The translation rows cascade with the profile.
    await db
      .delete(advisorProfiles)
      .where(eq(advisorProfiles.userId, advisorId));
    await db.delete(user).where(eq(user.id, advisorId));
    await pool.end();
  });

  it('opens an application with its text as the translation it was written in', async () => {
    await expect(
      repository.createIfAbsent(advisorId, {
        headline: 'ที่ปรึกษาภาษี',
        bio: 'ทำภาษีมา 9 ปี',
      }),
    ).resolves.toEqual(expect.objectContaining({ headline: 'ที่ปรึกษาภาษี' }));

    // An empty edit only touches `modifiedAt`: it must not copy the Thai into an English row.
    await runWithLocale('en', () => repository.updateByUserId(advisorId, {}));

    await expect(translations()).resolves.toEqual([
      { locale: 'th', headline: 'ที่ปรึกษาภาษี', bio: 'ทำภาษีมา 9 ปี' },
    ]);
  });

  it('edits in English without touching the Thai source', async () => {
    // The bio is left out, so the English row keeps the text the reader saw for it.
    await expect(
      runWithLocale('en', () =>
        repository.updateByUserId(advisorId, {
          headline: `Tax advisor ${tag}`,
        }),
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        headline: `Tax advisor ${tag}`,
        bio: 'ทำภาษีมา 9 ปี',
      }),
    );

    await expect(sourceText()).resolves.toEqual({
      headline: 'ที่ปรึกษาภาษี',
      bio: 'ทำภาษีมา 9 ปี',
    });
    await expect(
      runWithLocale('en', () => repository.findByUserId(advisorId)),
    ).resolves.toEqual(
      expect.objectContaining({ headline: `Tax advisor ${tag}` }),
    );
    await expect(repository.findByUserId(advisorId)).resolves.toEqual(
      expect.objectContaining({ headline: 'ที่ปรึกษาภาษี' }),
    );
  });

  it('edits in Thai on the profile and its Thai row, leaving the English as it was', async () => {
    await expect(
      repository.updateByUserId(advisorId, { bio: 'ทำภาษีมา 10 ปี' }),
    ).resolves.toEqual(
      expect.objectContaining({
        headline: 'ที่ปรึกษาภาษี',
        bio: 'ทำภาษีมา 10 ปี',
      }),
    );

    await expect(sourceText()).resolves.toEqual({
      headline: 'ที่ปรึกษาภาษี',
      bio: 'ทำภาษีมา 10 ปี',
    });
    await expect(translations()).resolves.toEqual([
      { locale: 'th', headline: 'ที่ปรึกษาภาษี', bio: 'ทำภาษีมา 10 ปี' },
      { locale: 'en', headline: `Tax advisor ${tag}`, bio: 'ทำภาษีมา 9 ปี' },
    ]);
    await expect(
      repository.updateByUserId(crypto.randomUUID(), { headline: 'Nobody' }),
    ).resolves.toBeUndefined();
  });

  it('lists and searches the headline in the reader’s language', async () => {
    await db
      .insert(advisorIdentity)
      .values({ advisorId, verificationStatus: 'VERIFIED' });
    await db.insert(services).values({
      id: serviceId,
      advisorId,
      categoryId,
      name: 'วางแผนภาษี',
      priceSatang: 50000,
      durationMinutes: 30,
      isPublished: true,
    });
    const search = Object.assign(new PublicAdvisorQueryDto(), { q: tag });

    await expect(
      runWithLocale('en', () => repository.findDiscoverableById(advisorId)),
    ).resolves.toEqual(
      expect.objectContaining({
        headline: `Tax advisor ${tag}`,
        bio: 'ทำภาษีมา 9 ปี',
      }),
    );
    await expect(repository.findDiscoverableById(advisorId)).resolves.toEqual(
      expect.objectContaining({ headline: 'ที่ปรึกษาภาษี' }),
    );
    await expect(
      runWithLocale('en', () => repository.countDiscoverable(search)),
    ).resolves.toBe(1);
    await expect(repository.countDiscoverable(search)).resolves.toBe(0);
  });
});
