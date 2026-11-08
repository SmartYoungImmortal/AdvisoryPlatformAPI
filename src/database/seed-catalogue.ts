/**
 * Seed the large demo catalogue: some eighty advisors and three hundred
 * services across every category, with their packages and photographs.
 *
 * `pnpm db:seed:catalogue -- --yes`
 *
 * Run `pnpm db:seed -- --yes` first: this adds people and services to the
 * catalogue that seed writes, and needs its twelve categories and its admin
 * (who verifies the identities below) to be there.
 *
 * The data lives in `catalogue/part-*.ts` (shape in `catalogue/types.ts`);
 * this script only writes it. It keeps `seed.ts`'s rules: it refuses to run
 * without `--yes` or under `NODE_ENV=test`, prints the host before writing,
 * creates accounts through better-auth so the demo password works, and looks
 * for every row before writing it (an advisor by email, a service by advisor
 * and name, a package by service and name, a translation by its locale), so a
 * second run adds nothing and a row edited in the app since keeps its edit.
 *
 * Every advisor here is listed: discovery shows only verified advisors
 * (`isVerifiedAdvisor`), so each gets a VERIFIED identity with no document
 * behind it, as `seed.ts` does for the home hero's people, and the `advisor`
 * role an approval would have written.
 *
 * Photographs are absolute Pexels URLs, written straight into
 * `service_images.object_key` (the cover at carousel index 0) and `user.image`;
 * the API returns an http(s) key unchanged, so they need no storage behind them.
 */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import { AppModule } from '@/app.module';
import type { Env } from '@/config/env.schema';
import { ENV_KEYS } from '@/config/env.constants';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  adminProfiles,
  advisorGlobalAvailability,
  advisorIdentity,
  advisorProfileTranslations,
  advisorProfiles,
  availabilityProfiles,
  availabilityWeeklyWindows,
  serviceCategories,
  serviceCategoryTranslations,
  serviceImages,
  servicePackageTranslations,
  servicePackages,
  serviceTranslations,
  services,
  user,
} from '@/database/schema';
import { createAuth } from '@/modules/auth/auth.config';
import { PART_A } from '@/database/catalogue/part-a';
import { PART_B } from '@/database/catalogue/part-b';
import { PART_C } from '@/database/catalogue/part-c';
import {
  CATEGORY_NAMES,
  NEW_CATEGORIES,
  type CatalogueAdvisor,
} from '@/database/catalogue/types';

/** The demo password, the same as `seed.ts`'s: every demo account shares it. */
const DEMO_PASSWORD = 'AdvisoryDemo!2026';

/** The admin `seed.ts` creates, who stands as the verifier of these identities. */
const ADMIN_EMAIL = 'admin@advisory.demo';

/**
 * The parts to write: all of them, or those named with `--only=a,c`, so a
 * finished part can go in while another is still being checked.
 */
const PARTS: Readonly<Record<string, readonly CatalogueAdvisor[]>> = {
  a: PART_A,
  b: PART_B,
  c: PART_C,
};
const only = process.argv
  .find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
  .map((part) => part.trim().toLowerCase())
  .filter(Boolean);
const ADVISORS: readonly CatalogueAdvisor[] = Object.entries(PARTS)
  .filter(([part]) => !only || only.includes(part))
  .flatMap(([, advisors]) => advisors);

/** Weekday office hours and a Saturday morning, as `seed.ts` gives its advisors. */
const WEEKLY_WINDOWS = [
  { dayOfWeek: 1, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 2, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 3, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 4, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 5, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 6, startTime: '09:00:00', endTime: '12:00:00' },
] as const;

const AVAILABILITY_NAME = 'เวลาทำงานปกติ';

const tally = { created: 0, existing: 0 };

function note(what: string, created: boolean): void {
  if (created) tally.created += 1;
  else tally.existing += 1;
  if (created) console.log(`  created  ${what}`);
}

function assertAllowedToRun(databaseUrl: string): string {
  if (!process.argv.includes('--yes')) {
    throw new Error(
      'Refusing to run without --yes. This writes to the shared database, and there is no staging copy of it.',
    );
  }
  if (process.env.NODE_ENV === 'test') {
    throw new Error(
      'Refusing to run with NODE_ENV=test. The test database is the one the suites TRUNCATE.',
    );
  }
  try {
    return new URL(databaseUrl).host;
  } catch {
    throw new Error(
      'DATABASE_URL is not a URL this script can read a host from.',
    );
  }
}

/** A Bangkok wall-clock time `day` days from today. */
function bangkok(day: number, hour: number): Date {
  const now = new Date();
  const date = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + day,
      hour - 7,
    ),
  );
  return date;
}

/** The data's own consistency, checked before anything is written. */
function assertCatalogue(): void {
  const emails = new Set<string>();
  for (const advisor of ADVISORS) {
    if (emails.has(advisor.email))
      throw new Error(`Advisor ${advisor.email} appears twice.`);
    emails.add(advisor.email);
    for (const service of advisor.services) {
      if (!CATEGORY_NAMES.includes(service.category)) {
        throw new Error(
          `${advisor.email} / ${service.name}: unknown category ${service.category}.`,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  assertCatalogue();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const config = app.get(ConfigService<Env, true>);
    const host = assertAllowedToRun(
      config.get(ENV_KEYS.DATABASE_URL, { infer: true }),
    );
    const serviceCount = ADVISORS.reduce(
      (sum, advisor) => sum + advisor.services.length,
      0,
    );
    console.log(
      `Seeding the catalogue (${ADVISORS.length} advisors, ${serviceCount} services) into ${host}\n`,
    );

    const db: DrizzleDB = app.get<DrizzleDB>(DRIZZLE);
    const auth = createAuth(db, config);

    const [admin] = await db
      .select({ id: adminProfiles.userId })
      .from(adminProfiles)
      .innerJoin(user, eq(user.id, adminProfiles.userId))
      .where(eq(user.email, ADMIN_EMAIL))
      .limit(1);
    if (!admin)
      throw new Error(
        `No ${ADMIN_EMAIL}: run \`pnpm db:seed -- --yes\` first.`,
      );

    console.log('Categories');
    const categoryIds = new Map<string, string>();
    for (const category of NEW_CATEGORIES) {
      let [row] = await db
        .select({ id: serviceCategories.id })
        .from(serviceCategories)
        .where(eq(serviceCategories.name, category.name))
        .limit(1);
      if (!row) {
        [row] = await db
          .insert(serviceCategories)
          .values({
            name: category.name,
            description: category.description,
            createdByUserId: admin.id,
            updatedByUserId: admin.id,
          })
          .returning({ id: serviceCategories.id });
        note(category.name, true);
      } else note(category.name, false);
      const written = await db
        .insert(serviceCategoryTranslations)
        .values([
          {
            categoryId: row.id,
            locale: 'th',
            name: category.name,
            description: category.description,
          },
          { categoryId: row.id, locale: 'en', ...category.en },
        ])
        .onConflictDoNothing()
        .returning({ locale: serviceCategoryTranslations.locale });
      note(`translations of ${category.name}`, written.length > 0);
    }
    for (const name of CATEGORY_NAMES) {
      const [row] = await db
        .select({ id: serviceCategories.id })
        .from(serviceCategories)
        .where(eq(serviceCategories.name, name))
        .limit(1);
      if (!row)
        throw new Error(
          `No category ${name}: run \`pnpm db:seed -- --yes\` first.`,
        );
      categoryIds.set(name, row.id);
    }

    for (const advisor of ADVISORS) {
      console.log(`\n${advisor.displayName} <${advisor.email}>`);

      // The account, through better-auth so the password is hashed as the API expects.
      let [account] = await db
        .select({ id: user.id, image: user.image, role: user.role })
        .from(user)
        .where(eq(user.email, advisor.email))
        .limit(1);
      if (!account) {
        await auth.api.signUpEmail({
          body: {
            email: advisor.email,
            password: DEMO_PASSWORD,
            name: advisor.displayName,
            fullName: advisor.fullName,
            timezone: 'Asia/Bangkok',
          },
        });
        [account] = await db
          .select({ id: user.id, image: user.image, role: user.role })
          .from(user)
          .where(eq(user.email, advisor.email))
          .limit(1);
        if (!account)
          throw new Error(
            `better-auth accepted ${advisor.email} but no row appeared`,
          );
        note('account', true);
      } else note('account', false);
      const advisorId = account.id;

      // The portrait fills an empty `image` only, and the role an approval writes.
      const patch: { image?: string; role?: string } = {};
      if (!account.image) patch.image = advisor.portrait;
      if (account.role !== 'admin' && account.role !== 'advisor')
        patch.role = 'advisor';
      if (Object.keys(patch).length > 0) {
        await db.update(user).set(patch).where(eq(user.id, advisorId));
        note('portrait and role', true);
      }

      const [profile] = await db
        .select({ userId: advisorProfiles.userId })
        .from(advisorProfiles)
        .where(eq(advisorProfiles.userId, advisorId))
        .limit(1);
      if (!profile) {
        await db.insert(advisorProfiles).values({
          userId: advisorId,
          headline: advisor.headline,
          bio: advisor.bio,
        });
        note('profile', true);
      } else note('profile', false);
      const profileWritten = await db
        .insert(advisorProfileTranslations)
        .values([
          {
            advisorId,
            locale: 'th',
            headline: advisor.headline,
            bio: advisor.bio,
          },
          { advisorId, locale: 'en', ...advisor.en },
        ])
        .onConflictDoNothing()
        .returning({ locale: advisorProfileTranslations.locale });
      note('profile translations', profileWritten.length > 0);

      // Verified, so discovery lists them; no document, as for the hero's people.
      const [identity] = await db
        .select({ advisorId: advisorIdentity.advisorId })
        .from(advisorIdentity)
        .where(eq(advisorIdentity.advisorId, advisorId))
        .limit(1);
      if (!identity) {
        await db.insert(advisorIdentity).values({
          advisorId,
          documentObjectKey: null,
          verificationStatus: 'VERIFIED',
          verifiedByAdminId: admin.id,
          rejectionReason: null,
          submittedAt: bangkok(-30, 10),
          verifiedAt: bangkok(-29, 15),
        });
        note('identity', true);
      } else note('identity', false);

      // Slot geometry and office hours, or every service looks unbookable.
      const [global] = await db
        .select({ advisorId: advisorGlobalAvailability.advisorId })
        .from(advisorGlobalAvailability)
        .where(eq(advisorGlobalAvailability.advisorId, advisorId))
        .limit(1);
      if (!global) {
        await db.insert(advisorGlobalAvailability).values({ advisorId });
        note('availability defaults', true);
      } else note('availability defaults', false);
      let [availability] = await db
        .select({ id: availabilityProfiles.id })
        .from(availabilityProfiles)
        .where(
          and(
            eq(availabilityProfiles.advisorId, advisorId),
            eq(availabilityProfiles.name, AVAILABILITY_NAME),
          ),
        )
        .limit(1);
      if (!availability) {
        [availability] = await db
          .insert(availabilityProfiles)
          .values({ advisorId, name: AVAILABILITY_NAME })
          .returning({ id: availabilityProfiles.id });
        await db.insert(availabilityWeeklyWindows).values(
          WEEKLY_WINDOWS.map((window) => ({
            availabilityProfileId: availability.id,
            ...window,
          })),
        );
        note('office hours', true);
      } else note('office hours', false);

      for (const service of advisor.services) {
        let [row] = await db
          .select({ id: services.id })
          .from(services)
          .where(
            and(
              eq(services.advisorId, advisorId),
              eq(services.name, service.name),
            ),
          )
          .limit(1);
        if (!row) {
          [row] = await db
            .insert(services)
            .values({
              advisorId,
              categoryId: categoryIds.get(service.category)!,
              availabilityProfileId: availability.id,
              name: service.name,
              description: service.description,
              priceSatang: service.priceBaht * 100,
              durationMinutes: service.durationMinutes,
              isPublished: true,
              screeningRequired: service.screeningRequired ?? false,
              trialEnabled: service.trialMinutes !== undefined,
              trialDurationMinutes: service.trialMinutes ?? null,
            })
            .returning({ id: services.id });
          note(`service ${service.name}`, true);
        } else note(`service ${service.name}`, false);
        const serviceId = row.id;

        const translated = await db
          .insert(serviceTranslations)
          .values([
            {
              serviceId,
              locale: 'th',
              name: service.name,
              description: service.description,
            },
            { serviceId, locale: 'en', ...service.en },
          ])
          .onConflictDoNothing()
          .returning({ locale: serviceTranslations.locale });
        note(`translations of ${service.name}`, translated.length > 0);

        // Photographs at their carousel index; an index already holding a photo keeps it.
        const held = await db
          .select({ index: serviceImages.carouselIndex })
          .from(serviceImages)
          .where(eq(serviceImages.serviceId, serviceId));
        const taken = new Set(held.map((image) => image.index));
        const missing = service.photos
          .map((objectKey, carouselIndex) => ({
            serviceId,
            carouselIndex,
            objectKey,
          }))
          .filter((image) => !taken.has(image.carouselIndex));
        if (missing.length > 0) {
          await db.insert(serviceImages).values(missing);
          note(`${missing.length} photos of ${service.name}`, true);
        }

        for (const [sortOrder, pack] of service.packages.entries()) {
          let [packageRow] = await db
            .select({ id: servicePackages.id })
            .from(servicePackages)
            .where(
              and(
                eq(servicePackages.serviceId, serviceId),
                eq(servicePackages.name, pack.name),
              ),
            )
            .limit(1);
          if (!packageRow) {
            [packageRow] = await db
              .insert(servicePackages)
              .values({
                serviceId,
                name: pack.name,
                description: pack.description,
                durationMinutes: pack.durationMinutes,
                priceSatang: pack.priceBaht * 100,
                imageKey: null,
                sortOrder,
              })
              .returning({ id: servicePackages.id });
            note(`package ${pack.name}`, true);
          } else note(`package ${pack.name}`, false);
          const packWritten = await db
            .insert(servicePackageTranslations)
            .values([
              {
                packageId: packageRow.id,
                locale: 'th',
                name: pack.name,
                description: pack.description,
              },
              { packageId: packageRow.id, locale: 'en', ...pack.en },
            ])
            .onConflictDoNothing()
            .returning({ locale: servicePackageTranslations.locale });
          note(`translations of package ${pack.name}`, packWritten.length > 0);
        }
      }
    }

    console.log(
      `\nDone. ${tally.created} written, ${tally.existing} already present.`,
    );
    console.log(`Every demo account signs in with: ${DEMO_PASSWORD}`);
  } finally {
    // Closes the pool; without it the script hangs on an open connection.
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
