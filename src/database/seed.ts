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
 * until then.
 *
 * ## Demo activity
 *
 * The admin console is a set of queues, and an empty queue shows nothing about how
 * it reads. So the script also writes the rows the flows would have produced — a
 * run of past and upcoming bookings with their invoices, chat rooms and reviews,
 * refund cases against some of them, payouts for the settled ones, reports,
 * off-platform flags on messages that leaked a phone number or a LINE id, identity
 * submissions and skill-proof documents. They are demo state, written on purpose:
 * each is keyed on something the script recognises (`seed-demo-*` room names, a
 * message's text, a file name) so a second run finds them instead of doubling them.
 * Document keys are placeholder-image URLs (`demoDocument`) rather than SeaweedFS
 * keys, so the console can show a document on the review pages; a real upload
 * still stores a storage key.
 */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { and, eq, isNull } from 'drizzle-orm';
import { AppModule } from '@/app.module';
import type { Env } from '@/config/env.schema';
import { ENV_KEYS } from '@/config/env.constants';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  adminProfiles,
  advisorGlobalAvailability,
  advisorIdentity,
  advisorProfiles,
  advisorSkills,
  availabilityProfiles,
  availabilityWeeklyWindows,
  chatMembers,
  chatMessages,
  chatRooms,
  offPlatformFlags,
  payoutInvoices,
  payouts,
  refundCaseEvidence,
  refundCases,
  serviceAppointments,
  serviceCategories,
  serviceInvoices,
  serviceReviews,
  services,
  skillProofDocuments,
  skills,
  user,
  userReports,
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

/**
 * Stock portraits for the demo accounts, written to better-auth's `image` — a plain
 * URL the admin console draws as-is. Uploaded avatars still go to `avatar_key`; this
 * only fills an `image` that is empty, so it never overwrites a real one.
 */
const PORTRAITS: Readonly<Record<string, string>> = {
  'araya.s@advisory.demo': 'https://randomuser.me/api/portraits/women/44.jpg',
  'kanya.p@advisory.demo': 'https://randomuser.me/api/portraits/women/65.jpg',
  'thanakrit.w@advisory.demo': 'https://randomuser.me/api/portraits/men/32.jpg',
  'pimchanok.r@advisory.demo':
    'https://randomuser.me/api/portraits/women/68.jpg',
  'sarawut.k@advisory.demo': 'https://randomuser.me/api/portraits/men/75.jpg',
  'nattapong.d@advisory.demo': 'https://randomuser.me/api/portraits/men/46.jpg',
  'supaporn.t@advisory.demo':
    'https://randomuser.me/api/portraits/women/90.jpg',
  'admin@advisory.demo': 'https://randomuser.me/api/portraits/men/11.jpg',
};

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

/**
 * The one admin, without whom the moderation queues cannot be used at all.
 *
 * Every ruling route writes a reviewer id that references
 * `admin_profiles.user_id` — not `user.id` — so an admin with a session but no
 * `admin_profiles` row fails the foreign key on approve, reject and resolve. That
 * table was empty and nothing wrote to it, which made all six admin modules
 * unreachable in practice however correct their code was.
 *
 * `role` is set directly rather than through better-auth's admin plugin: the
 * plugin's `setRole` needs a signed-in admin to call it, and this is the account
 * that would have to exist first.
 */
const ADMIN = {
  email: 'admin@advisory.demo',
  displayName: 'ผู้ดูแลระบบ',
  fullName: 'ทีมผู้ดูแล Advisory',
} as const;

/** จันทร์ถึงศุกร์ 09:00-17:00, plus Saturday mornings. `dayOfWeek` is 0 = Sunday. */
const WEEKLY_WINDOWS = [
  { dayOfWeek: 1, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 2, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 3, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 4, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 5, startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 6, startTime: '09:00:00', endTime: '12:00:00' },
] as const;

/* ------------------------------------------------------------ demo activity */

type Side = 'advisee' | 'advisor';

interface BookingSeed {
  /** `jitsi_room_name` is `seed-demo-<key>`: how a re-run recognises the row. */
  readonly key: string;
  readonly advisor: string;
  readonly service: string;
  readonly advisee: string;
  /** Days from the day the script runs; negative is in the past. */
  readonly day: number;
  /** Bangkok hour the session starts. */
  readonly hour: number;
  readonly state: 'COMPLETED' | 'BOOKED' | 'CANCELLED';
  readonly invoice: 'RELEASED' | 'HELD_IN_ESCROW' | 'REFUNDED';
  readonly review?: { readonly stars: number; readonly comment: string };
  readonly chat: readonly (readonly [Side, string])[];
  /** Lines sent after the session ended — where a dispute usually starts. */
  readonly afterSession?: readonly (readonly [Side, string])[];
}

const ARAYA = 'araya.s@advisory.demo';
const KANYA = 'kanya.p@advisory.demo';
const THANAKRIT = 'thanakrit.w@advisory.demo';
const PIMCHANOK = 'pimchanok.r@advisory.demo';
const SARAWUT = 'sarawut.k@advisory.demo';
const NATTAPONG = 'nattapong.d@advisory.demo';
const SUPAPORN = 'supaporn.t@advisory.demo';

const BOOKINGS: readonly BookingSeed[] = [
  {
    key: 'b01',
    advisor: ARAYA,
    service: 'วางแผนภาษีสำหรับฟรีแลนซ์',
    advisee: NATTAPONG,
    day: -40,
    hour: 10,
    state: 'COMPLETED',
    invoice: 'RELEASED',
    review: {
      stars: 5,
      comment: 'อธิบายเรื่องลดหย่อนเข้าใจง่ายมาก ได้แผนกลับไปใช้จริง',
    },
    chat: [
      [
        'advisee',
        'สวัสดีครับ รายได้ผมมาจากหลายแพลตฟอร์ม ควรเตรียมเอกสารอะไรบ้างครับ',
      ],
      [
        'advisor',
        'เตรียมสรุปรายได้รายเดือนกับหนังสือรับรองการหักภาษีมาได้เลยค่ะ',
      ],
      ['advisee', 'ได้ครับ แล้วเจอกันตามนัดนะครับ'],
    ],
  },
  {
    key: 'b02',
    advisor: KANYA,
    service: 'ตรวจสัญญาก่อนเซ็น',
    advisee: SUPAPORN,
    day: -35,
    hour: 14,
    state: 'COMPLETED',
    invoice: 'RELEASED',
    review: {
      stars: 4,
      comment: 'ชี้จุดเสี่ยงในสัญญาเช่าได้ละเอียด แต่อยากให้มีสรุปเป็นเอกสาร',
    },
    chat: [
      ['advisee', 'ส่งร่างสัญญาเช่าอาคารให้ดูก่อนได้ไหมคะ'],
      ['advisor', 'ส่งอีเมลมาที่ kanya.law@gmail.com ก็ได้ค่ะ'],
      ['advisee', 'แนบในแชทนี้แทนนะคะ'],
    ],
  },
  {
    key: 'b03',
    advisor: THANAKRIT,
    service: 'ตรวจสุขภาพการตลาดของร้าน',
    advisee: NATTAPONG,
    day: -30,
    hour: 11,
    state: 'COMPLETED',
    invoice: 'RELEASED',
    review: {
      stars: 5,
      comment:
        'ได้รายการสิ่งที่ต้องหยุดทำทันทีกับสิ่งที่ควรลงเงินเพิ่ม คุ้มมาก',
    },
    chat: [
      ['advisee', 'ร้านผมยอดตกมาสามเดือนแล้วครับ อยากให้ช่วยดูแคมเปญโฆษณา'],
      ['advisee', 'ขอเบอร์ติดต่อได้ไหมครับ 089-123-4567 จะได้คุยนอกแอป'],
      ['advisor', 'คุยกันในแชทนี้ได้เลยครับ ข้อมูลจะได้อยู่ครบในที่เดียว'],
    ],
  },
  {
    key: 'b04',
    advisor: PIMCHANOK,
    service: 'คุยเรื่องความเครียดจากงาน',
    advisee: SUPAPORN,
    day: -28,
    hour: 19,
    state: 'COMPLETED',
    invoice: 'RELEASED',
    review: {
      stars: 5,
      comment: 'รู้สึกว่ามีคนฟังจริงๆ และได้วิธีแบ่งงานที่ใช้ได้เลย',
    },
    chat: [
      ['advisee', 'ช่วงนี้นอนไม่หลับเพราะงานค่ะ'],
      ['advisor', 'เดี๋ยวเราค่อยๆ ไล่ดูกันว่าอะไรกินพลังเราที่สุดนะคะ'],
    ],
  },
  {
    key: 'b05',
    advisor: SARAWUT,
    service: 'ซ้อมสัมภาษณ์งานสายเทค',
    advisee: NATTAPONG,
    day: -25,
    hour: 13,
    state: 'COMPLETED',
    invoice: 'RELEASED',
    review: {
      stars: 4,
      comment: 'ซ้อม system design ได้ตรงจุด คำถามเหมือนสัมภาษณ์จริง',
    },
    chat: [
      ['advisee', 'สัมภาษณ์ตำแหน่ง backend สัปดาห์หน้าครับ'],
      ['advisor', 'แอดไลน์มาได้เลยครับ LINE: @sarawut.dev จะส่งโจทย์ให้ก่อน'],
      ['advisee', 'ส่งในนี้ได้ไหมครับ'],
    ],
  },
  {
    key: 'b06',
    advisor: ARAYA,
    service: 'ตรวจแผนภาษีก่อนยื่น',
    advisee: SUPAPORN,
    day: -21,
    hour: 10,
    state: 'COMPLETED',
    invoice: 'RELEASED',
    review: {
      stars: 5,
      comment: 'เจอค่าลดหย่อนที่ตกไปสองรายการ ประหยัดภาษีไปเยอะ',
    },
    chat: [
      ['advisee', 'แนบแบบ ภ.ง.ด.90 ที่กรอกไว้แล้วค่ะ'],
      ['advisor', 'ได้รับแล้วค่ะ ขอดูใบเสร็จประกันด้วยนะคะ'],
    ],
  },
  {
    key: 'b07',
    advisor: KANYA,
    service: 'ปัญหาลูกจ้างและกฎหมายแรงงาน',
    advisee: NATTAPONG,
    day: -18,
    hour: 15,
    state: 'COMPLETED',
    invoice: 'HELD_IN_ESCROW',
    chat: [
      ['advisee', 'พนักงานขอค่าชดเชยหลังลาออกเอง ต้องจ่ายไหมครับ'],
      [
        'advisor',
        'ขึ้นกับว่าการลาออกนั้นเกิดจากอะไรค่ะ เดี๋ยวคุยรายละเอียดกันในนัด',
      ],
    ],
    afterSession: [
      [
        'advisee',
        'ผมแจ้งไว้ตอนจองว่าพนักงานลาออกเอง แต่ในนัดคุยเรื่องเลิกจ้างเกือบทั้งชั่วโมงเลยครับ',
      ],
      [
        'advisor',
        'ที่ถามเรื่องเลิกจ้างเพราะหนังสือที่แนบมาเขียนว่า "บริษัทขอให้ออก" ค่ะ ถ้าเป็นแบบนั้นต้องจ่ายค่าชดเชยนะคะ',
      ],
      ['advisee', 'แต่เขาเขียนเองนะครับ ผมจะขอคืนเงินแล้วกัน'],
    ],
  },
  {
    key: 'b08',
    advisor: THANAKRIT,
    service: 'วางแผนเปิดธุรกิจใหม่',
    advisee: SUPAPORN,
    day: -15,
    hour: 10,
    state: 'CANCELLED',
    invoice: 'REFUNDED',
    chat: [
      ['advisee', 'อยากเปิดร้านกาแฟเล็กๆ ค่ะ'],
      ['advisor', 'ขอเลื่อนนัดนะครับ ติดธุระด่วน'],
      ['advisee', 'แจ้งก่อนนัดแค่ชั่วโมงเดียวเองนะคะ'],
    ],
  },
  {
    key: 'b09',
    advisor: PIMCHANOK,
    service: 'ทบทวนเส้นทางอาชีพ',
    advisee: NATTAPONG,
    day: -12,
    hour: 18,
    state: 'COMPLETED',
    invoice: 'HELD_IN_ESCROW',
    chat: [
      [
        'advisee',
        'โอนตรงเข้าบัญชีได้ไหมครับ กสิกร 123-4-56789-0 จะได้ไม่เสียค่าธรรมเนียม',
      ],
      ['advisor', 'ชำระผ่านแพลตฟอร์มเท่านั้นนะคะ'],
    ],
    afterSession: [
      [
        'advisor',
        'ส่งสรุปแผน 90 วันกับแบบประเมินจุดแข็งให้แล้วนะคะ ลองทำก่อนนัดครั้งหน้าค่ะ',
      ],
      ['advisee', 'ขอบคุณครับ แต่ส่วนใหญ่ผมเคยอ่านเจอมาแล้ว'],
    ],
  },
  {
    key: 'b10',
    advisor: SARAWUT,
    service: 'เลือกสแตกให้โปรเจกต์แรก',
    advisee: SUPAPORN,
    day: -9,
    hour: 20,
    state: 'COMPLETED',
    invoice: 'HELD_IN_ESCROW',
    chat: [
      ['advisee', 'จะทำแอปจองคิวร้านเสริมสวยค่ะ'],
      ['advisor', 'เริ่มจากเว็บก่อนดีกว่าครับ เดี๋ยวอธิบายเหตุผลในนัด'],
    ],
    afterSession: [
      ['advisee', 'สายหลุดไปสามรอบเลยค่ะ รอบสุดท้ายหายไปสิบกว่านาที'],
      [
        'advisor',
        'ขออภัยครับ เน็ตบ้านผมล่มช่วงนั้น กลับมาได้ก็เหลือไม่กี่นาทีแล้ว',
      ],
      ['advisee', 'ได้คุยจริงๆ ไม่ถึงครึ่งเลยค่ะ ขอยื่นเรื่องคืนเงินนะคะ'],
      ['advisor', 'ได้ครับ ถ้าสะดวกผมนัดชดเชยให้ฟรีอีก 30 นาทีก็ได้ครับ'],
    ],
  },
  {
    key: 'b11',
    advisor: ARAYA,
    service: 'ปิดงบบริษัทเล็กครั้งแรก',
    advisee: NATTAPONG,
    day: -5,
    hour: 10,
    state: 'COMPLETED',
    invoice: 'HELD_IN_ESCROW',
    chat: [
      ['advisee', 'บริษัทเพิ่งจดปีแรกครับ ยังไม่เคยปิดงบ'],
      ['advisor', 'เตรียมสมุดบัญชีธนาคารทั้งปีมาได้เลยค่ะ'],
    ],
  },
  {
    key: 'b12',
    advisor: KANYA,
    service: 'ตรวจสัญญาก่อนเซ็น',
    advisee: NATTAPONG,
    day: 3,
    hour: 13,
    state: 'BOOKED',
    invoice: 'HELD_IN_ESCROW',
    chat: [['advisee', 'สัญญาจ้างฟรีแลนซ์ครับ ส่งไฟล์ให้ก่อนนัดนะครับ']],
  },
  {
    key: 'b13',
    advisor: PIMCHANOK,
    service: 'คุยเรื่องความเครียดจากงาน',
    advisee: NATTAPONG,
    day: 5,
    hour: 19,
    state: 'BOOKED',
    invoice: 'HELD_IN_ESCROW',
    chat: [['advisee', 'ขอคุยต่อจากครั้งก่อนครับ']],
  },
  {
    key: 'b14',
    advisor: SARAWUT,
    service: 'ซ้อมสัมภาษณ์งานสายเทค',
    advisee: SUPAPORN,
    day: 7,
    hour: 14,
    state: 'BOOKED',
    invoice: 'HELD_IN_ESCROW',
    chat: [['advisee', 'สัมภาษณ์ตำแหน่ง frontend ค่ะ']],
  },
];

/**
 * The frontend serves the demo documents itself, from `public/demo-docs/` —
 * specimen certificates, ID cards and screenshots, each watermarked and naming
 * a fictional issuer. A key under this path is same-origin to the console; a
 * real upload's key is still a SeaweedFS key.
 */
const DEMO_DOCS = '/demo-docs';

/** Refunds, against the booking whose invoice they claim, with what was attached. */
const REFUNDS = [
  {
    booking: 'b07',
    status: 'OPEN',
    reason: 'คำแนะนำไม่ตรงกับปัญหาที่แจ้งไว้ตอนจอง ขอคืนเงินค่าปรึกษา',
    evidence: [
      {
        key: 'refunds/booking-note-nattapong.png',
        name: 'รายละเอียดการจอง.png',
        mime: 'image/png',
      },
    ],
  },
  {
    booking: 'b08',
    status: 'APPROVED',
    reason: 'ที่ปรึกษายกเลิกนัดก่อนเวลาเพียงหนึ่งชั่วโมง',
    evidence: [
      {
        key: 'refunds/cancel-notice-supaporn.png',
        name: 'แจ้งเตือนยกเลิกนัด.png',
        mime: 'image/png',
      },
    ],
  },
  {
    booking: 'b09',
    status: 'REJECTED',
    reason: 'รู้สึกว่าไม่ได้อะไรใหม่จากการปรึกษา',
    evidence: [],
  },
  {
    booking: 'b10',
    status: 'OPEN',
    reason: 'สัญญาณเสียงหลุดเกือบครึ่งชั่วโมง ปรึกษาไม่ครบเวลา',
    evidence: [
      {
        key: 'refunds/call-dropped-supaporn.jpg',
        name: 'ภาพหน้าจอสายหลุด.jpg',
        mime: 'image/jpeg',
      },
      {
        key: 'refunds/call-log-seed-demo-b10.png',
        name: 'บันทึกการเชื่อมต่อ.png',
        mime: 'image/png',
      },
    ],
  },
] as const;

/** Settled invoices, bundled per advisor the way a payout run would bundle them. */
const PAYOUTS = [
  {
    key: 'araya',
    bookings: ['b01', 'b06'],
    status: 'PAID',
    transferId: 'trsf_demo_araya_0001',
  },
  { key: 'kanya', bookings: ['b02'], status: 'PENDING', transferId: null },
  { key: 'thanakrit', bookings: ['b03'], status: 'PENDING', transferId: null },
  { key: 'pimchanok', bookings: ['b04'], status: 'FAILED', transferId: null },
  { key: 'sarawut', bookings: ['b05'], status: 'PENDING', transferId: null },
] as const;

/** Flags on the chat lines above that leaked a way to leave the platform. */
const FLAGS = [
  {
    booking: 'b03',
    text: 'ขอเบอร์ติดต่อได้ไหมครับ 089-123-4567 จะได้คุยนอกแอป',
    pattern: 'phone number',
    status: 'PENDING_REVIEW',
  },
  {
    booking: 'b05',
    text: 'แอดไลน์มาได้เลยครับ LINE: @sarawut.dev จะส่งโจทย์ให้ก่อน',
    pattern: 'line id',
    status: 'PENDING_REVIEW',
  },
  {
    booking: 'b09',
    text: 'โอนตรงเข้าบัญชีได้ไหมครับ กสิกร 123-4-56789-0 จะได้ไม่เสียค่าธรรมเนียม',
    pattern: 'bank account',
    status: 'CONFIRMED',
  },
  {
    booking: 'b02',
    text: 'ส่งอีเมลมาที่ kanya.law@gmail.com ก็ได้ค่ะ',
    pattern: 'email address',
    status: 'DISMISSED',
  },
] as const;

const REPORTS = [
  {
    booking: 'b05',
    reporter: NATTAPONG,
    reported: SARAWUT,
    status: 'OPEN',
    reason: 'ชวนไปคุยนอกแพลตฟอร์มและขอให้ติดต่อทางไลน์ส่วนตัว',
  },
  {
    booking: 'b08',
    reporter: SUPAPORN,
    reported: THANAKRIT,
    status: 'OPEN',
    reason: 'ยกเลิกนัดกระชั้นชิดโดยไม่แจ้งล่วงหน้า',
  },
  {
    booking: 'b09',
    reporter: PIMCHANOK,
    reported: NATTAPONG,
    status: 'ACTIONED',
    reason: 'ขอให้โอนเงินนอกระบบระหว่างแชท',
  },
  {
    booking: 'b07',
    reporter: NATTAPONG,
    reported: KANYA,
    status: 'DISMISSED',
    reason: 'คำแนะนำไม่ตรงกับที่ตกลงกันไว้',
  },
] as const;

/** Identity submissions: two cleared, two waiting, one sent back. */
const IDENTITIES = [
  {
    advisor: ARAYA,
    status: 'VERIFIED',
    submitted: -62,
    decided: -60,
    reason: null,
  },
  {
    advisor: KANYA,
    status: 'VERIFIED',
    submitted: -55,
    decided: -54,
    reason: null,
  },
  {
    advisor: THANAKRIT,
    status: 'SUBMITTED',
    submitted: -2,
    decided: null,
    reason: null,
  },
  {
    advisor: PIMCHANOK,
    status: 'SUBMITTED',
    submitted: -1,
    decided: null,
    reason: null,
  },
  {
    advisor: SARAWUT,
    status: 'REJECTED',
    submitted: -6,
    decided: -5,
    reason: 'รูปบัตรประชาชนไม่ชัด กรุณาถ่ายใหม่ให้เห็นเลขครบทุกหลัก',
  },
] as const;

/**
 * Whether a key is a demo stand-in: a specimen under `DEMO_DOCS`, an older
 * placeholder image, or the first run's dead `seed/` key.
 */
function isDemoKey(key: string | null | undefined): boolean {
  return (
    !!key &&
    (key.startsWith('seed/') ||
      key.startsWith('https://placehold.co/') ||
      key.startsWith(`${DEMO_DOCS}/`))
  );
}

/** The specimen ID card for a demo advisor: `araya.s@…` → `id-card-araya.jpg`. */
function demoIdCard(email: string): string {
  return `${DEMO_DOCS}/identity/id-card-${email.split(/[.@]/)[0]}.jpg`;
}

const SKILL_PROOFS = [
  {
    advisor: ARAYA,
    skill: 'บัญชีและงบการเงิน',
    file: 'ใบอนุญาตผู้สอบบัญชี.pdf',
    doc: 'skill-proofs/cpa-license-araya.pdf',
    status: 'APPROVED',
    day: -58,
  },
  {
    advisor: KANYA,
    skill: 'สัญญาธุรกิจ',
    file: 'ใบอนุญาตว่าความ.pdf',
    doc: 'skill-proofs/lawyer-license-kanya.pdf',
    status: 'APPROVED',
    day: -50,
  },
  {
    advisor: THANAKRIT,
    skill: 'การตลาดดิจิทัล',
    file: 'Google-Ads-Certification.pdf',
    doc: 'skill-proofs/ads-certificate-thanakrit.pdf',
    status: 'PENDING',
    day: -3,
  },
  {
    advisor: PIMCHANOK,
    skill: 'จิตวิทยาการปรึกษา',
    file: 'ใบประกอบวิชาชีพจิตวิทยาคลินิก.pdf',
    doc: 'skill-proofs/psychology-license-pimchanok.pdf',
    status: 'PENDING',
    day: -2,
  },
  {
    advisor: SARAWUT,
    skill: 'พัฒนาเว็บแอปพลิเคชัน',
    file: 'AWS-Solutions-Architect.pdf',
    doc: 'skill-proofs/cloud-architect-sarawut.pdf',
    status: 'PENDING',
    day: -1,
  },
  {
    advisor: SARAWUT,
    skill: 'วิทยาการข้อมูล',
    file: 'screenshot-linkedin.png',
    doc: 'skill-proofs/profile-screenshot-sarawut.png',
    status: 'REJECTED',
    day: -8,
  },
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

/** A Bangkok wall-clock time `day` days from today. */
function bangkok(day: number, hour: number, minute = 0): Date {
  const today = new Date(Date.now() + 7 * 3_600_000);
  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + day,
      hour - 7,
      minute,
    ),
  );
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** The platform's cut, as the checkout takes it. */
const FEE_RATE = 0.05;

/** Postgres' exclusion-violation code: the advisor already has that hour. */
function isSlotTaken(error: unknown): boolean {
  const code = (e: unknown) => (e as { code?: string } | undefined)?.code;
  return (
    code(error) === '23P01' ||
    code((error as { cause?: unknown } | undefined)?.cause) === '23P01'
  );
}

interface SeededBooking {
  readonly appointmentId: string;
  readonly invoiceId: string;
  readonly chatRoomId: string;
  readonly advisorId: string;
  readonly adviseeId: string;
  readonly amountSatang: number;
  readonly feeSatang: number;
  readonly end: Date;
}

async function seedActivity(
  db: DrizzleDB,
  ctx: {
    readonly adminId: string;
    readonly userIdByEmail: ReadonlyMap<string, string>;
    readonly skillIds: ReadonlyMap<string, string>;
    readonly serviceByKey: ReadonlyMap<
      string,
      { id: string; priceSatang: number; durationMinutes: number }
    >;
  },
): Promise<void> {
  const userId = (email: string): string => {
    const found = ctx.userIdByEmail.get(email);
    if (!found)
      throw new Error(`demo activity names ${email}, who was not seeded`);
    return found;
  };
  const booked = new Map<string, SeededBooking>();

  console.log('\nDemo bookings');
  for (const b of BOOKINGS) {
    const service = ctx.serviceByKey.get(`${b.advisor}|${b.service}`);
    if (!service) throw new Error(`no service "${b.service}" for ${b.advisor}`);
    const advisorId = userId(b.advisor);
    const adviseeId = userId(b.advisee);
    const roomName = `seed-demo-${b.key}`;
    const start = bangkok(b.day, b.hour);
    const end = new Date(start.getTime() + service.durationMinutes * MINUTE);
    const cancelled = b.state === 'CANCELLED';

    let [appointment] = await db
      .select({
        id: serviceAppointments.id,
        chatRoomId: serviceAppointments.chatRoomId,
      })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.jitsiRoomName, roomName))
      .limit(1);

    if (appointment) note(`booking ${b.key}`, false);
    else {
      try {
        [appointment] = await db
          .insert(serviceAppointments)
          .values({
            serviceId: service.id,
            advisorId,
            adviseeId,
            startTime: start,
            endTime: end,
            unavailableUntil: new Date(end.getTime() + 15 * MINUTE),
            blocksAvailability: !cancelled,
            cancelledByUserId: cancelled ? advisorId : null,
            cancelledAt: cancelled ? new Date(start.getTime() - HOUR) : null,
            jitsiRoomName: roomName,
            state: b.state,
            createdAt: new Date(start.getTime() - 3 * DAY),
          })
          .returning({
            id: serviceAppointments.id,
            chatRoomId: serviceAppointments.chatRoomId,
          });
      } catch (error) {
        if (!isSlotTaken(error)) throw error;
        console.log(
          `  skipped  booking ${b.key}: ${b.advisor} is already booked then`,
        );
        continue;
      }
      note(`booking ${b.key}`, true);
    }

    // The room is made after the booking, so a booking the slot refused never
    // leaves an empty room behind it.
    let chatRoomId = appointment.chatRoomId;
    if (!chatRoomId) {
      const [room] = await db
        .insert(chatRooms)
        .values({ createdAt: new Date(start.getTime() - 3 * DAY) })
        .returning({ id: chatRooms.id });
      chatRoomId = room.id;
      await db.insert(chatMembers).values([
        { chatRoomId, memberUserId: adviseeId },
        { chatRoomId, memberUserId: advisorId },
      ]);
      await db
        .update(serviceAppointments)
        .set({ chatRoomId })
        .where(eq(serviceAppointments.id, appointment.id));
    }

    // Chat lines land in the two days before the session, never in the future;
    // the after-session lines start ten minutes after it ends.
    const chatStart = Math.min(start.getTime() - 2 * DAY, Date.now() - DAY);
    const lines = [
      ...b.chat.map(([side, message], index) => ({
        side,
        message,
        at: chatStart + index * 7 * MINUTE,
      })),
      ...(b.afterSession ?? []).map(([side, message], index) => ({
        side,
        message,
        at: Math.min(
          end.getTime() + (10 + index * 6) * MINUTE,
          Date.now() - MINUTE,
        ),
      })),
    ];
    for (const { side, message, at } of lines) {
      const [line] = await db
        .select({ id: chatMessages.id })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.chatRoomId, chatRoomId),
            eq(chatMessages.message, message),
          ),
        )
        .limit(1);
      if (line) continue;
      await db.insert(chatMessages).values({
        chatRoomId,
        senderUserId: side === 'advisee' ? adviseeId : advisorId,
        message,
        createdAt: new Date(at),
      });
    }

    const amountSatang = service.priceSatang;
    const feeSatang = Math.round(amountSatang * FEE_RATE);
    let [invoice] = await db
      .select({ id: serviceInvoices.id })
      .from(serviceInvoices)
      .where(eq(serviceInvoices.appointmentId, appointment.id))
      .limit(1);
    if (!invoice) {
      [invoice] = await db
        .insert(serviceInvoices)
        .values({
          appointmentId: appointment.id,
          amountSatang,
          platformFeeSatang: feeSatang,
          providerChargeId: `chrg_demo_${b.key}`,
          status: b.invoice,
          payoutEligibleAt:
            b.state === 'COMPLETED' ? new Date(end.getTime() + 7 * DAY) : null,
          createdAt: new Date(start.getTime() - 3 * DAY + MINUTE),
        })
        .returning({ id: serviceInvoices.id });
    }

    if (b.review) {
      const [review] = await db
        .select({ id: serviceReviews.appointmentId })
        .from(serviceReviews)
        .where(eq(serviceReviews.appointmentId, appointment.id))
        .limit(1);
      if (!review) {
        await db.insert(serviceReviews).values({
          appointmentId: appointment.id,
          stars: b.review.stars,
          comment: b.review.comment,
          createdAt: new Date(end.getTime() + HOUR),
        });
      }
    }

    booked.set(b.key, {
      appointmentId: appointment.id,
      invoiceId: invoice.id,
      chatRoomId,
      advisorId,
      adviseeId,
      amountSatang,
      feeSatang,
      end,
    });
  }

  console.log('\nDemo refunds');
  for (const r of REFUNDS) {
    const b = booked.get(r.booking);
    if (!b) continue;
    let [refund] = await db
      .select({ id: refundCases.id, createdAt: refundCases.createdAt })
      .from(refundCases)
      .where(eq(refundCases.invoiceId, b.invoiceId))
      .limit(1);
    if (refund) note(`refund on ${r.booking}`, false);
    else {
      const createdAt = new Date(b.end.getTime() + DAY);
      const decided = r.status !== 'OPEN';
      [refund] = await db
        .insert(refundCases)
        .values({
          invoiceId: b.invoiceId,
          requestedByUserId: b.adviseeId,
          reviewedByAdminId: decided ? ctx.adminId : null,
          reason: r.reason,
          status: r.status,
          createdAt,
          resolvedAt: decided ? new Date(createdAt.getTime() + DAY) : null,
        })
        .returning({ id: refundCases.id, createdAt: refundCases.createdAt });
      note(`refund on ${r.booking}`, true);
    }

    // Attached with the request; the composite key makes a re-run a no-op.
    for (const file of r.evidence) {
      const objectKey = `${DEMO_DOCS}/${file.key}`;
      const [attached] = await db
        .select({ key: refundCaseEvidence.objectKey })
        .from(refundCaseEvidence)
        .where(
          and(
            eq(refundCaseEvidence.refundCaseId, refund.id),
            eq(refundCaseEvidence.objectKey, objectKey),
          ),
        )
        .limit(1);
      if (attached) continue;
      await db.insert(refundCaseEvidence).values({
        refundCaseId: refund.id,
        objectKey,
        originalFileName: file.name,
        mimeType: file.mime,
        createdAt: refund.createdAt,
      });
      note(`evidence ${file.name}`, true);
    }
  }

  console.log('\nDemo payouts');
  for (const p of PAYOUTS) {
    const settled = p.bookings.map((key) => booked.get(key));
    if (settled.some((b) => !b)) continue;
    const rows = settled as SeededBooking[];
    const [linked] = await db
      .select({ payoutId: payoutInvoices.payoutId })
      .from(payoutInvoices)
      .where(eq(payoutInvoices.invoiceId, rows[0].invoiceId))
      .limit(1);
    if (linked) {
      note(`payout ${p.key}`, false);
      continue;
    }
    const lastEnd = Math.max(...rows.map((b) => b.end.getTime()));
    const createdAt = new Date(Math.min(lastEnd + 8 * DAY, Date.now() - HOUR));
    const [payout] = await db
      .insert(payouts)
      .values({
        advisorId: rows[0].advisorId,
        amountSatang: rows.reduce(
          (sum, b) => sum + b.amountSatang - b.feeSatang,
          0,
        ),
        providerTransferId: p.transferId,
        status: p.status,
        createdAt,
        paidAt:
          p.status === 'PAID' ? new Date(createdAt.getTime() + 2 * HOUR) : null,
      })
      .returning({ id: payouts.id });
    await db
      .insert(payoutInvoices)
      .values(
        rows.map((b) => ({ payoutId: payout.id, invoiceId: b.invoiceId })),
      );
    note(`payout ${p.key}`, true);
  }

  console.log('\nDemo off-platform flags');
  for (const f of FLAGS) {
    const b = booked.get(f.booking);
    if (!b) continue;
    const [message] = await db
      .select({ id: chatMessages.id, createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatRoomId, b.chatRoomId),
          eq(chatMessages.message, f.text),
        ),
      )
      .limit(1);
    if (!message) continue;
    const [found] = await db
      .select({ id: offPlatformFlags.id })
      .from(offPlatformFlags)
      .where(eq(offPlatformFlags.messageId, message.id))
      .limit(1);
    if (found) {
      note(`flag on ${f.booking}`, false);
      continue;
    }
    const decided = f.status !== 'PENDING_REVIEW';
    await db.insert(offPlatformFlags).values({
      messageId: message.id,
      matchedPattern: f.pattern,
      status: f.status,
      reviewedByAdminId: decided ? ctx.adminId : null,
      createdAt: new Date(message.createdAt.getTime() + MINUTE),
      reviewedAt: decided ? new Date(message.createdAt.getTime() + DAY) : null,
    });
    note(`flag on ${f.booking}`, true);
  }

  console.log('\nDemo reports');
  for (const r of REPORTS) {
    const b = booked.get(r.booking);
    if (!b) continue;
    const reporterUserId = userId(r.reporter);
    const reportedUserId = userId(r.reported);
    const [found] = await db
      .select({ id: userReports.id })
      .from(userReports)
      .where(
        and(
          eq(userReports.reporterUserId, reporterUserId),
          eq(userReports.reportedUserId, reportedUserId),
          eq(userReports.reason, r.reason),
        ),
      )
      .limit(1);
    if (found) {
      note(`report on ${r.booking}`, false);
      continue;
    }
    const createdAt = new Date(
      Math.min(b.end.getTime() + 2 * HOUR, Date.now() - HOUR),
    );
    const decided = r.status !== 'OPEN';
    await db.insert(userReports).values({
      reporterUserId,
      reportedUserId,
      chatRoomId: b.chatRoomId,
      reason: r.reason,
      status: r.status,
      reviewedByAdminId: decided ? ctx.adminId : null,
      createdAt,
      resolvedAt: decided ? new Date(createdAt.getTime() + DAY) : null,
    });
    note(`report on ${r.booking}`, true);
  }

  console.log('\nDemo identity submissions');
  for (const i of IDENTITIES) {
    const advisorId = userId(i.advisor);
    const document = demoIdCard(i.advisor);
    const [found] = await db
      .select({
        advisorId: advisorIdentity.advisorId,
        key: advisorIdentity.documentObjectKey,
      })
      .from(advisorIdentity)
      .where(eq(advisorIdentity.advisorId, advisorId))
      .limit(1);
    if (found) {
      // Demo keys from an earlier run (dead `seed/…` keys, or an older
      // stand-in) move to the current one; a real upload's key is never touched.
      if (isDemoKey(found.key) && found.key !== document) {
        await db
          .update(advisorIdentity)
          .set({ documentObjectKey: document })
          .where(eq(advisorIdentity.advisorId, advisorId));
        note(`identity document ${i.advisor}`, true);
      } else note(`identity ${i.advisor}`, false);
      continue;
    }
    await db.insert(advisorIdentity).values({
      advisorId,
      documentObjectKey: document,
      verificationStatus: i.status,
      verifiedByAdminId: i.decided === null ? null : ctx.adminId,
      rejectionReason: i.reason,
      submittedAt: bangkok(i.submitted, 9, 12),
      verifiedAt:
        i.status === 'VERIFIED' && i.decided !== null
          ? bangkok(i.decided, 14)
          : null,
    });
    note(`identity ${i.advisor}`, true);
  }

  console.log('\nDemo skill proofs');
  for (const s of SKILL_PROOFS) {
    const advisorId = userId(s.advisor);
    const skillId = ctx.skillIds.get(s.skill);
    if (!skillId)
      throw new Error(
        `demo proof names skill "${s.skill}", which was not seeded`,
      );
    const document = `${DEMO_DOCS}/${s.doc}`;
    const [found] = await db
      .select({
        id: skillProofDocuments.id,
        key: skillProofDocuments.objectKey,
      })
      .from(skillProofDocuments)
      .where(
        and(
          eq(skillProofDocuments.advisorId, advisorId),
          eq(skillProofDocuments.skillId, skillId),
          eq(skillProofDocuments.originalFileName, s.file),
        ),
      )
      .limit(1);
    if (found) {
      if (isDemoKey(found.key) && found.key !== document) {
        await db
          .update(skillProofDocuments)
          .set({ objectKey: document })
          .where(eq(skillProofDocuments.id, found.id));
        note(`proof document ${s.file}`, true);
      } else note(`proof ${s.file}`, false);
      continue;
    }
    const decided = s.status !== 'PENDING';
    await db.insert(skillProofDocuments).values({
      advisorId,
      skillId,
      objectKey: document,
      originalFileName: s.file,
      reviewStatus: s.status,
      reviewedByAdminId: decided ? ctx.adminId : null,
      rejectionReason:
        s.status === 'REJECTED'
          ? 'ภาพหน้าจอโปรไฟล์ไม่ใช่เอกสารรับรอง กรุณาแนบใบรับรองตัวจริง'
          : null,
      createdAt: bangkok(s.day, 11),
      reviewedAt: decided ? bangkok(s.day + 1, 15) : null,
    });
    note(`proof ${s.file}`, true);
  }
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

    /** Fills `image` from `PORTRAITS` where it is still empty. */
    const ensurePortrait = async (email: string): Promise<void> => {
      const url = PORTRAITS[email];
      const id = userIdByEmail.get(email);
      if (!url || !id) return;
      const [row] = await db
        .select({ image: user.image })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      if (row?.image) return;
      await db.update(user).set({ image: url }).where(eq(user.id, id));
      note(`portrait ${email}`, true);
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

    console.log('\nAdmin');
    const adminId = await signUp(ADMIN);
    // `role` is what better-auth's access control reads to resolve the admin
    // statements; the `admin_profiles` row is what the moderation tables' foreign
    // keys point at. Both are needed, and they are separate things.
    await db.update(user).set({ role: 'admin' }).where(eq(user.id, adminId));
    const [adminProfile] = await db
      .select({ userId: adminProfiles.userId })
      .from(adminProfiles)
      .where(eq(adminProfiles.userId, adminId))
      .limit(1);
    if (adminProfile) note('admin profile', false);
    else {
      await db.insert(adminProfiles).values({ userId: adminId });
      note('admin profile', true);
    }

    // The seed sets the catalogue up on the admin's behalf, so the categories and
    // skills it wrote before the audit columns existed are the admin's. Only rows
    // with no author are touched — anything an admin created since keeps its own.
    for (const table of [serviceCategories, skills]) {
      const stamped = await db
        .update(table)
        .set({ createdByUserId: adminId, updatedByUserId: adminId })
        .where(isNull(table.createdByUserId))
        .returning({ id: table.id });
      if (stamped.length > 0)
        note(`authored ${stamped.length} catalogue rows`, true);
    }

    /** `email|service name` → the row the demo bookings are made against. */
    const serviceByKey = new Map<
      string,
      { id: string; priceSatang: number; durationMinutes: number }
    >();

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
        const shape = {
          priceSatang: service.priceBaht * 100,
          durationMinutes: service.durationMinutes,
        };
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
          serviceByKey.set(`${advisor.email}|${service.name}`, {
            id: found.id,
            ...shape,
          });
          continue;
        }
        const [inserted] = await db
          .insert(services)
          .values({
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
          })
          .returning({ id: services.id });
        note(`service ${service.name}`, true);
        serviceByKey.set(`${advisor.email}|${service.name}`, {
          id: inserted.id,
          ...shape,
        });
      }
    }

    console.log('\nPortraits');
    for (const email of Object.keys(PORTRAITS)) await ensurePortrait(email);

    await seedActivity(db, {
      adminId,
      userIdByEmail,
      skillIds,
      serviceByKey,
    });

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
