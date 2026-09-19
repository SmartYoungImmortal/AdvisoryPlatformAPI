/**
 * Seed the shared Supabase project with a demo catalogue.
 *
 * `pnpm db:seed -- --yes`
 *
 * ## Why this is guarded rather than convenient
 *
 * There is one database and no staging copy of it. Everything in this repo that
 * touches Supabase is a deliberate act a person takes — `db:migrate` is manual,
 * `verify.yml` builds its own throwaway Postgres rather than reading a
 * `DATABASE_URL` secret, and README.md says outright that it refuses to ship a
 * script that picks a database for you. This script writes, so it inherits that
 * rule: it will not run without `--yes`, it refuses `NODE_ENV=test`, and it prints
 * the host it is about to write to before it writes anything.
 *
 * ## Why users are created through better-auth instead of inserted
 *
 * A row in `user` is not an account that can sign in. Credentials live in
 * `account.password`, hashed the way better-auth hashes them, and reproducing that
 * here would be a second implementation of the one thing that must not drift. So
 * the script boots the Nest application context, builds the same `auth` instance
 * the API serves, and calls its sign-up API. The demo passwords work because
 * better-auth itself set them.
 *
 * ## Idempotence
 *
 * Every step looks for its row before writing, keyed on something natural — an
 * email, a category name, a service name for an advisor. Running it twice adds
 * nothing and changes nothing, which is what makes it safe to run again after a
 * migration rather than something that has to be got right first time.
 *
 * ## What it deliberately does not seed
 *
 * `service_images` takes a SeaweedFS object key, which the API presigns on read.
 * Writing the frontend's R2 URLs into that column would produce keys that cannot
 * be presigned and reads that fail, so images are left out: they need SeaweedFS up
 * and a real upload. The frontend keeps serving covers from its own R2 bucket
 * until then. Bookings, invoices, payouts, reports and chat are also left alone —
 * they are the output of flows, and seeding them would fake state no flow produced.
 */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import { AppModule } from '@/app.module';
import type { Env } from '@/config/env.schema';
import { ENV_KEYS } from '@/config/env.constants';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  advisorGlobalAvailability,
  advisorProfiles,
  advisorSkills,
  availabilityProfiles,
  availabilityWeeklyWindows,
  serviceCategories,
  services,
  skills,
  user,
} from '@/database/schema';
import { createAuth } from '@/modules/auth/auth.config';

/* ------------------------------------------------------------------ the data */

const CATEGORIES = [
  ['ธุรกิจและการตลาด', 'วางแผนธุรกิจ กลยุทธ์การตลาด และการขยายกิจการ'],
  ['การเงินและภาษี', 'ภาษีบุคคลและนิติบุคคล การวางแผนการเงินส่วนบุคคล'],
  ['กฎหมายและสัญญา', 'ร่างและตรวจสัญญา ข้อพิพาท และการจดทะเบียน'],
  ['การศึกษาและอาชีพ', 'เลือกเส้นทางการศึกษา เตรียมสมัครงาน และพัฒนาสายอาชีพ'],
  ['สุขภาพใจ', 'ความเครียด ความสัมพันธ์ และการดูแลสุขภาพใจ'],
  [
    'เทคโนโลยีและงานดิจิทัล',
    'พัฒนาซอฟต์แวร์ ข้อมูล และการใช้เครื่องมือดิจิทัล',
  ],
] as const;

const SKILLS = [
  'การวางแผนภาษี',
  'บัญชีและงบการเงิน',
  'กฎหมายแรงงาน',
  'สัญญาธุรกิจ',
  'การตลาดดิจิทัล',
  'การวางแผนธุรกิจ',
  'การให้คำปรึกษาด้านอาชีพ',
  'จิตวิทยาการปรึกษา',
  'พัฒนาเว็บแอปพลิเคชัน',
  'วิทยาการข้อมูล',
] as const;

/** A password every demo account shares. It is a demo credential, not a secret. */
const DEMO_PASSWORD = 'AdvisoryDemo!2026';

interface AdvisorSeed {
  readonly email: string;
  readonly displayName: string;
  readonly fullName: string;
  readonly headline: string;
  readonly bio: string;
  readonly skills: readonly string[];
  readonly services: readonly {
    readonly name: string;
    readonly description: string;
    readonly category: string;
    readonly priceBaht: number;
    readonly durationMinutes: number;
    readonly screeningRequired?: boolean;
    readonly trialMinutes?: number;
  }[];
}

const ADVISORS: readonly AdvisorSeed[] = [
  {
    email: 'araya.s@advisory.demo',
    displayName: 'อารยา ส.',
    fullName: 'อารยา สุวรรณเกษม',
    headline: 'นักวางแผนภาษีและการเงินส่วนบุคคล',
    bio: 'ที่ปรึกษาภาษีที่ทำงานกับฟรีแลนซ์และเจ้าของกิจการขนาดเล็กมา 9 ปี ถนัดเรื่องการยื่นภาษีของคนที่มีรายได้หลายทาง และการวางค่าลดหย่อนให้ใช้ได้เต็มสิทธิ์',
    skills: ['การวางแผนภาษี', 'บัญชีและงบการเงิน'],
    services: [
      {
        name: 'วางแผนภาษีสำหรับฟรีแลนซ์',
        description:
          'ไล่ดูรายได้ทุกทางที่คุณมีในปีนี้ แล้ววางว่าควรยื่นแบบไหน ใช้ค่าลดหย่อนอะไรได้ และต้องเก็บหลักฐานอะไรไว้ จบด้วยแผนที่เอาไปทำตามได้ทันที',
        category: 'การเงินและภาษี',
        priceBaht: 1200,
        durationMinutes: 60,
        screeningRequired: true,
        trialMinutes: 15,
      },
      {
        name: 'ตรวจแผนภาษีก่อนยื่น',
        description:
          'มีแผนอยู่แล้วแต่ไม่แน่ใจ ส่งมาให้ตรวจก่อนยื่นจริง ดูว่ามีช่องที่พลาดหรือค่าลดหย่อนที่ยังไม่ได้ใช้',
        category: 'การเงินและภาษี',
        priceBaht: 800,
        durationMinutes: 30,
      },
      {
        name: 'ปิดงบบริษัทเล็กครั้งแรก',
        description:
          'สำหรับเจ้าของกิจการที่ต้องปิดงบปีแรก ไล่ตั้งแต่เอกสารที่ต้องมี ไปจนถึงลำดับการยื่นและกำหนดเวลาของแต่ละแบบ',
        category: 'การเงินและภาษี',
        priceBaht: 2500,
        durationMinutes: 90,
      },
    ],
  },
  {
    email: 'kanya.p@advisory.demo',
    displayName: 'กัญญา พรหมมา',
    fullName: 'กัญญา พรหมมา',
    headline: 'ที่ปรึกษากฎหมายธุรกิจและสัญญา',
    bio: 'ทนายความที่ทำงานฝั่งสัญญาธุรกิจและกฎหมายแรงงาน รับตรวจสัญญาให้สตาร์ตอัปและธุรกิจครอบครัว เน้นอธิบายให้เข้าใจว่าแต่ละข้อผูกอะไรไว้กับใคร',
    skills: ['กฎหมายแรงงาน', 'สัญญาธุรกิจ'],
    services: [
      {
        name: 'ตรวจสัญญาก่อนเซ็น',
        description:
          'ส่งสัญญามาก่อนนัด แล้วคุยกันทีละข้อว่าข้อไหนเสียเปรียบ ข้อไหนแก้ได้ และข้อไหนควรยืนยันให้ตัดออก',
        category: 'กฎหมายและสัญญา',
        priceBaht: 1500,
        durationMinutes: 60,
        screeningRequired: true,
      },
      {
        name: 'ปัญหาลูกจ้างและกฎหมายแรงงาน',
        description:
          'เลิกจ้าง ค่าชดเชย สัญญาจ้าง หรือข้อพิพาทกับลูกจ้าง คุยเพื่อให้รู้ว่ากฎหมายกำหนดอะไรไว้และทางเลือกที่มีคืออะไร',
        category: 'กฎหมายและสัญญา',
        priceBaht: 1800,
        durationMinutes: 60,
      },
    ],
  },
  {
    email: 'thanakrit.w@advisory.demo',
    displayName: 'ธนกฤต ว.',
    fullName: 'ธนกฤต วงศ์อารีย์',
    headline: 'ที่ปรึกษาการตลาดดิจิทัลและการวางแผนธุรกิจ',
    bio: 'ทำการตลาดให้แบรนด์ไทยมา 11 ปี ทั้งฝั่งเอเจนซีและฝั่งแบรนด์ ถนัดช่วยธุรกิจที่ยอดนิ่งหาว่าปัญหาอยู่ที่สินค้า ราคา หรือช่องทาง',
    skills: ['การตลาดดิจิทัล', 'การวางแผนธุรกิจ'],
    services: [
      {
        name: 'ตรวจสุขภาพการตลาดของร้าน',
        description:
          'ดูของที่คุณทำอยู่ทั้งหมด แล้วบอกว่าอันไหนคุ้มให้ทำต่อ อันไหนควรหยุด และอันไหนที่ยังไม่ได้ลองแต่ควรลอง',
        category: 'ธุรกิจและการตลาด',
        priceBaht: 1500,
        durationMinutes: 60,
        trialMinutes: 15,
      },
      {
        name: 'วางแผนเปิดธุรกิจใหม่',
        description:
          'ตั้งแต่กลุ่มลูกค้า ราคา ไปจนถึงงบที่ต้องมีก่อนเริ่ม จบด้วยแผน 90 วันแรกที่ทำตามได้',
        category: 'ธุรกิจและการตลาด',
        priceBaht: 2800,
        durationMinutes: 90,
        screeningRequired: true,
      },
    ],
  },
  {
    email: 'pimchanok.r@advisory.demo',
    displayName: 'พิมพ์ชนก ร.',
    fullName: 'พิมพ์ชนก รัตนโกศล',
    headline: 'นักจิตวิทยาการปรึกษาและที่ปรึกษาด้านอาชีพ',
    bio: 'นักจิตวิทยาการปรึกษาที่ทำงานกับคนวัยทำงานเรื่องความเครียดจากงานและการตัดสินใจเปลี่ยนสายอาชีพ คุยแบบไม่ตัดสิน และไม่รีบสรุปแทนคุณ',
    skills: ['จิตวิทยาการปรึกษา', 'การให้คำปรึกษาด้านอาชีพ'],
    services: [
      {
        name: 'คุยเรื่องความเครียดจากงาน',
        description:
          'พื้นที่หนึ่งชั่วโมงสำหรับเล่าว่าเกิดอะไรขึ้น แล้วค่อยๆ แยกว่าอะไรที่เปลี่ยนได้และอะไรที่ต้องหาวิธีอยู่กับมัน',
        category: 'สุขภาพใจ',
        priceBaht: 1000,
        durationMinutes: 60,
        trialMinutes: 20,
      },
      {
        name: 'ทบทวนเส้นทางอาชีพ',
        description:
          'สำหรับคนที่กำลังลังเลว่าจะอยู่ต่อหรือเปลี่ยน ไล่ดูว่าอะไรที่คุณให้ค่าจริง แล้วเทียบกับทางเลือกที่มีอยู่ตรงหน้า',
        category: 'การศึกษาและอาชีพ',
        priceBaht: 1200,
        durationMinutes: 60,
      },
    ],
  },
  {
    email: 'sarawut.k@advisory.demo',
    displayName: 'ศราวุธ ก.',
    fullName: 'ศราวุธ กิตติวัฒน์',
    headline: 'วิศวกรซอฟต์แวร์และที่ปรึกษาด้านข้อมูล',
    bio: 'เขียนซอฟต์แวร์มา 12 ปี ปัจจุบันดูฝั่งข้อมูลให้บริษัทค้าปลีก รับปรึกษาเรื่องเลือกสแตก การวางโครงสร้างข้อมูล และการสัมภาษณ์งานสายเทค',
    skills: ['พัฒนาเว็บแอปพลิเคชัน', 'วิทยาการข้อมูล'],
    services: [
      {
        name: 'เลือกสแตกให้โปรเจกต์แรก',
        description:
          'เล่าโปรเจกต์ที่อยากทำมา แล้วคุยกันว่าควรใช้อะไร ไม่ควรใช้อะไร และงานส่วนไหนที่จะกินเวลามากกว่าที่คิด',
        category: 'เทคโนโลยีและงานดิจิทัล',
        priceBaht: 900,
        durationMinutes: 45,
      },
      {
        name: 'ซ้อมสัมภาษณ์งานสายเทค',
        description:
          'สัมภาษณ์จริงหนึ่งรอบ แล้วให้ฟีดแบ็กตรงๆ ว่าคำตอบไหนยังไม่ผ่าน และควรเล่าใหม่อย่างไร',
        category: 'เทคโนโลยีและงานดิจิทัล',
        priceBaht: 1100,
        durationMinutes: 60,
        screeningRequired: true,
      },
    ],
  },
];

const ADVISEES = [
  {
    email: 'nattapong.d@advisory.demo',
    displayName: 'ณัฐพงศ์ ด.',
    fullName: 'ณัฐพงศ์ เดชอุดม',
  },
  {
    email: 'supaporn.t@advisory.demo',
    displayName: 'สุภาพร ท.',
    fullName: 'สุภาพร ทองเจริญ',
  },
] as const;

/** จันทร์ถึงศุกร์ 09:00-17:00, plus Saturday mornings. `dayOfWeek` is 0 = Sunday. */
const WEEKLY_WINDOWS = [
  { dayOfWeek: 1, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 2, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 3, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 4, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 5, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 6, startTime: '09:00:00', endTime: '12:00:00' },
] as const;

/* ------------------------------------------------------------------- guards */

function assertAllowedToRun(databaseUrl: string): string {
  if (!process.argv.includes('--yes')) {
    throw new Error(
      'Refusing to run without --yes. This writes to the shared database, and there is no staging copy of it.',
    );
  }
  if (process.env.NODE_ENV === 'test') {
    throw new Error(
      'Refusing to run with NODE_ENV=test. The test database is the one the suites TRUNCATE; seeding it would fight them.',
    );
  }

  let host: string;
  try {
    host = new URL(databaseUrl).host;
  } catch {
    throw new Error(
      'DATABASE_URL is not a URL this script can read a host from.',
    );
  }
  return host;
}

/* ------------------------------------------------------------------- helpers */

const tally = { created: 0, existing: 0 };

function note(what: string, created: boolean): void {
  if (created) tally.created += 1;
  else tally.existing += 1;
  console.log(`  ${created ? 'created ' : 'present '} ${what}`);
}

/** The `id` of a row matched on `name`, inserting it only when absent. */
async function ensureNamed(
  db: DrizzleDB,
  table: typeof serviceCategories | typeof skills,
  name: string,
  description: string | null,
): Promise<string> {
  const [found] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.name, name))
    .limit(1);
  if (found) {
    note(name, false);
    return found.id;
  }
  const [row] = await db
    .insert(table)
    .values({ name, description })
    .returning({ id: table.id });
  note(name, true);
  return row.id;
}

/* ---------------------------------------------------------------------- main */

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const config = app.get(ConfigService<Env, true>);
    const databaseUrl = config.get(ENV_KEYS.DATABASE_URL, { infer: true });
    const host = assertAllowedToRun(databaseUrl);

    console.log(`Seeding ${host}`);
    console.log('');

    const db = app.get<DrizzleDB>(DRIZZLE);
    const auth = createAuth(db, config);

    /**
     * Sign-up through better-auth rather than an insert, so the password is hashed
     * the way the running API expects. A duplicate email makes it throw, which is
     * the idempotent path: the account is already there.
     */
    const userIdByEmail = new Map<string, string>();
    const signUp = async (person: {
      email: string;
      displayName: string;
      fullName: string;
    }): Promise<string> => {
      const [existing] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, person.email))
        .limit(1);
      if (existing) {
        note(person.email, false);
        userIdByEmail.set(person.email, existing.id);
        return existing.id;
      }
      await auth.api.signUpEmail({
        body: {
          email: person.email,
          password: DEMO_PASSWORD,
          name: person.displayName,
          fullName: person.fullName,
          timezone: 'Asia/Bangkok',
        },
      });
      const [created] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, person.email))
        .limit(1);
      if (!created) {
        throw new Error(
          `better-auth accepted ${person.email} but no row appeared`,
        );
      }
      note(person.email, true);
      userIdByEmail.set(person.email, created.id);
      return created.id;
    };

    console.log('Categories');
    const categoryIds = new Map<string, string>();
    for (const [name, description] of CATEGORIES) {
      categoryIds.set(
        name,
        await ensureNamed(db, serviceCategories, name, description),
      );
    }

    console.log('\nSkills');
    const skillIds = new Map<string, string>();
    for (const name of SKILLS) {
      skillIds.set(name, await ensureNamed(db, skills, name, null));
    }

    console.log('\nAdvisees');
    for (const person of ADVISEES) await signUp(person);

    for (const advisor of ADVISORS) {
      console.log(`\n${advisor.displayName}`);
      const advisorId = await signUp(advisor);

      // Profile. The composite of userId is the key, so a re-run finds it.
      const [profile] = await db
        .select({ userId: advisorProfiles.userId })
        .from(advisorProfiles)
        .where(eq(advisorProfiles.userId, advisorId))
        .limit(1);
      if (profile) {
        note('profile', false);
      } else {
        await db.insert(advisorProfiles).values({
          userId: advisorId,
          headline: advisor.headline,
          bio: advisor.bio,
        });
        note('profile', true);
      }

      for (const skillName of advisor.skills) {
        const skillId = skillIds.get(skillName)!;
        const [link] = await db
          .select({ advisorId: advisorSkills.advisorId })
          .from(advisorSkills)
          .where(
            and(
              eq(advisorSkills.advisorId, advisorId),
              eq(advisorSkills.skillId, skillId),
            ),
          )
          .limit(1);
        if (link) note(`skill ${skillName}`, false);
        else {
          await db.insert(advisorSkills).values({ advisorId, skillId });
          note(`skill ${skillName}`, true);
        }
      }

      // Slot geometry. Without a global row the slots endpoint has no interval,
      // horizon or notice to resolve a date range against, so it returns nothing
      // and every service looks unbookable.
      const [global] = await db
        .select({ advisorId: advisorGlobalAvailability.advisorId })
        .from(advisorGlobalAvailability)
        .where(eq(advisorGlobalAvailability.advisorId, advisorId))
        .limit(1);
      if (global) note('availability defaults', false);
      else {
        await db.insert(advisorGlobalAvailability).values({ advisorId });
        note('availability defaults', true);
      }

      const profileName = 'เวลาทำงานปกติ';
      let [availability] = await db
        .select({ id: availabilityProfiles.id })
        .from(availabilityProfiles)
        .where(
          and(
            eq(availabilityProfiles.advisorId, advisorId),
            eq(availabilityProfiles.name, profileName),
          ),
        )
        .limit(1);
      if (availability) note(`availability "${profileName}"`, false);
      else {
        [availability] = await db
          .insert(availabilityProfiles)
          .values({ advisorId, name: profileName })
          .returning({ id: availabilityProfiles.id });
        note(`availability "${profileName}"`, true);
        for (const window of WEEKLY_WINDOWS) {
          await db.insert(availabilityWeeklyWindows).values({
            availabilityProfileId: availability.id,
            ...window,
          });
        }
      }

      for (const service of advisor.services) {
        const [found] = await db
          .select({ id: services.id })
          .from(services)
          .where(
            and(
              eq(services.advisorId, advisorId),
              eq(services.name, service.name),
            ),
          )
          .limit(1);
        if (found) {
          note(`service ${service.name}`, false);
          continue;
        }
        await db.insert(services).values({
          advisorId,
          categoryId: categoryIds.get(service.category)!,
          availabilityProfileId: availability.id,
          name: service.name,
          description: service.description,
          // Satang, integer, as the column and the API both hold it.
          priceSatang: service.priceBaht * 100,
          durationMinutes: service.durationMinutes,
          isPublished: true,
          screeningRequired: service.screeningRequired ?? false,
          trialEnabled: service.trialMinutes !== undefined,
          trialDurationMinutes: service.trialMinutes ?? null,
        });
        note(`service ${service.name}`, true);
      }
    }

    console.log('');
    console.log(
      `Done. ${tally.created} written, ${tally.existing} already present.`,
    );
    console.log(`Every demo account signs in with: ${DEMO_PASSWORD}`);
  } finally {
    // Closes the pool through DatabaseLifecycle's shutdown hook; without it the
    // script hangs on an open connection to the pooler.
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
