/**
 * The shape of the large demo catalogue (`seed-catalogue.ts`): advisors, each
 * with their services, each service with its packages and photographs, every
 * text in Thai with its English beside it.
 *
 * Kept apart from `seed.ts`, which seeds the small hand-made catalogue and the
 * demo activity around it; this one only adds people and services, keyed the
 * same idempotent way (an advisor by email, a service by advisor and name, a
 * package by service and name), so it can be run again without doubling
 * anything.
 */

/** A text's English: its `en` translation row. */
export interface InEnglish {
  readonly name: string;
  readonly description: string;
}

/** A way the service is sold: its own length and price. */
export interface CataloguePackage {
  /** Thai. Short: what you get, in a few words ("ถามข้อเดียว", "วางแผนทั้งปี"). */
  readonly name: string;
  /** Thai. One sentence: what this package covers that the others do not. */
  readonly description: string;
  readonly en: InEnglish;
  readonly durationMinutes: number;
  /** Whole baht. */
  readonly priceBaht: number;
}

export interface CatalogueService {
  /** Thai. Unique within its advisor. */
  readonly name: string;
  /** Thai. Two or three sentences: who it is for, what happens, what you leave with. */
  readonly description: string;
  readonly en: InEnglish;
  /** The Thai name of one of `CATEGORY_NAMES`. */
  readonly category: string;
  /** Whole baht: the cheapest package's price. */
  readonly priceBaht: number;
  /** The cheapest package's length. */
  readonly durationMinutes: number;
  /** Asks the advisee a few questions before booking. */
  readonly screeningRequired?: boolean;
  /** Offers a free first call of this many minutes. */
  readonly trialMinutes?: number;
  /**
   * Photographs, the cover first, then one or two for the gallery: Pexels CDN
   * URLs (`https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1200`),
   * each checked to load. No two services share one.
   */
  readonly photos: readonly [string, ...string[]];
  /** Two or three, cheapest first. */
  readonly packages: readonly CataloguePackage[];
}

export interface CatalogueAdvisor {
  /** `<prefix>.<firstname>.<initial>@advisory.demo`, lower-case latin, unique. */
  readonly email: string;
  /** Thai, as the cards print it: first name and surname. */
  readonly displayName: string;
  readonly fullName: string;
  /**
   * A square portrait: a Pexels CDN URL ending
   * `?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`, checked to load.
   */
  readonly portrait: string;
  /** Thai. Their role in a few words ("นักวางแผนภาษีสำหรับฟรีแลนซ์"). */
  readonly headline: string;
  /** Thai. Two or three sentences: experience, who they help, how they work. */
  readonly bio: string;
  readonly en: { readonly headline: string; readonly bio: string };
  /** Three to five. */
  readonly services: readonly CatalogueService[];
}

/** A category the catalogue adds beside `seed.ts`'s twelve. */
export interface CatalogueCategory {
  readonly name: string;
  readonly description: string;
  readonly en: InEnglish;
}

/** The categories this catalogue adds; `seed.ts` holds the first twelve. */
export const NEW_CATEGORIES: readonly CatalogueCategory[] = [
  {
    name: 'การลงทุนและการออม',
    description: 'เริ่มลงทุน จัดพอร์ต และวางแผนออมเงินระยะยาว',
    en: {
      name: 'Investing & Saving',
      description:
        'Starting to invest, building a portfolio, and long-term saving',
    },
  },
  {
    name: 'ประกันและวางแผนเกษียณ',
    description: 'เลือกประกันให้พอดี และวางแผนเงินหลังเกษียณ',
    en: {
      name: 'Insurance & Retirement',
      description:
        'Choosing the right cover, and planning money for retirement',
    },
  },
  {
    name: 'ร้านอาหารและคาเฟ่',
    description: 'เปิดร้าน คุมต้นทุน วางเมนู และบริหารหน้าร้าน',
    en: {
      name: 'Restaurants & Cafés',
      description: 'Opening, food costs, menus, and running the floor',
    },
  },
  {
    name: 'ภาษาและการสอบ',
    description: 'ภาษาอังกฤษเพื่องาน และเตรียมสอบวัดระดับ',
    en: {
      name: 'Languages & Exams',
      description: 'English for work, and preparing for proficiency tests',
    },
  },
  {
    name: 'เรียนต่อและย้ายประเทศ',
    description: 'เรียนต่อต่างประเทศ ทุน วีซ่า และการย้ายไปทำงาน',
    en: {
      name: 'Study Abroad & Relocation',
      description: 'Studying abroad, scholarships, visas, and moving for work',
    },
  },
  {
    name: 'สุขภาพและโภชนาการ',
    description: 'อาหาร การออกกำลังกาย และการดูแลสุขภาพในชีวิตประจำวัน',
    en: {
      name: 'Health & Nutrition',
      description: 'Food, exercise, and looking after your health day to day',
    },
  },
  {
    name: 'ออกแบบและคอนเทนต์',
    description: 'แบรนด์ งานออกแบบ และการทำคอนเทนต์บนโซเชียล',
    en: {
      name: 'Design & Content',
      description: 'Branding, design work, and making content for social media',
    },
  },
];

/** Every category a catalogue service may name: `seed.ts`'s twelve, then `NEW_CATEGORIES`. */
export const CATEGORY_NAMES: readonly string[] = [
  'ธุรกิจและการตลาด',
  'การเงินและภาษี',
  'กฎหมายและสัญญา',
  'การศึกษาและอาชีพ',
  'สุขภาพใจ',
  'เทคโนโลยีและงานดิจิทัล',
  'อสังหาริมทรัพย์และบ้าน',
  'สินเชื่อและการจัดการหนี้',
  'ทรัพยากรบุคคลและการจ้างงาน',
  'บัญชีและการตรวจสอบ',
  'ฟรีแลนซ์และงานอิสระ',
  'ร้านค้าออนไลน์และอีคอมเมิร์ซ',
  ...NEW_CATEGORIES.map((category) => category.name),
];
