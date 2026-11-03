import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { advisorProfiles, user } from '@/database/schema';
import { availabilityProfiles } from './availability';

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  // Who created and who last changed the row — the admin console's Created by /
  // Updated by. Nullable: rows written before these columns existed have no author.
  createdByUserId: uuid('created_by_user_id').references(() => user.id),
  updatedByUserId: uuid('updated_by_user_id').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => serviceCategories.id),
    // The other categories the service is also found under, beside its own (`categoryId`, the
    // one it is shown as). Ids rather than a join table: two at most, filtered on, never joined.
    extraCategoryIds: uuid('extra_category_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    // Required by the service-creation contract. Kept nullable while the S4 CRUD migration
    // backfills existing draft services that predate Availability Profiles.
    availabilityProfileId: uuid('availability_profile_id').references(
      () => availabilityProfiles.id,
    ),
    name: varchar('name').notNull(),
    description: text('description'),
    priceSatang: integer('price_satang').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    // Null means no per-Service daily consultation-minute limit.
    dailyConsultationLimitMinutes: integer('daily_consultation_limit_minutes'),
    isPublished: boolean('is_published').notNull().default(false),
    // Independent switches — booking requires neither. See docs/ER.README.md.
    screeningRequired: boolean('screening_required').notNull().default(false),
    trialEnabled: boolean('trial_enabled').notNull().default(false),
    // Null unless trialEnabled.
    trialDurationMinutes: integer('trial_duration_minutes'),
    // The advisor's other services this one's page shows, in order; empty lets the page choose.
    // Ids rather than a join table: three at most, read with the service, never queried by.
    relatedServiceIds: uuid('related_service_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    modifiedAt: timestamp('modified_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'services_related_service_limit',
      sql`coalesce(array_length(${table.relatedServiceIds}, 1), 0) <= 3`,
    ),
    check(
      'services_extra_category_limit',
      sql`coalesce(array_length(${table.extraCategoryIds}, 1), 0) <= 2`,
    ),
    index('services_extra_category_ids_idx').using(
      'gin',
      table.extraCategoryIds,
    ),
    check('services_price_satang_nonnegative', sql`${table.priceSatang} >= 0`),
    check(
      'services_duration_minutes_positive',
      sql`${table.durationMinutes} > 0`,
    ),
    check(
      'services_daily_limit_positive',
      sql`${table.dailyConsultationLimitMinutes} IS NULL OR ${table.dailyConsultationLimitMinutes} > 0`,
    ),
    check(
      'services_trial_duration_consistent',
      sql`(${table.trialEnabled} AND ${table.trialDurationMinutes} > 0) OR (NOT ${table.trialEnabled} AND ${table.trialDurationMinutes} IS NULL)`,
    ),
  ],
);

/**
 * The packages a service is sold in: its lengths and prices, each with its own
 * name and line ("Quick question", 30 minutes; "In depth", 90). A service with
 * none is sold as it always was, at its own `durationMinutes` and
 * `priceSatang`; a booking made on a package snapshots its length into the
 * appointment's end time, so a package changed later leaves it as booked.
 */
export const servicePackages = pgTable(
  'service_packages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    name: varchar('name').notNull(),
    description: text('description'),
    durationMinutes: integer('duration_minutes').notNull(),
    priceSatang: integer('price_satang').notNull(),
    // The package's own picture, apart from the service's photographs: a storage key, or an
    // absolute URL for a demo picture. Null shows none.
    imageKey: text('image_key'),
    // The order the packages are offered in, lowest first.
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    modifiedAt: timestamp('modified_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('service_packages_service_order_idx').on(
      table.serviceId,
      table.sortOrder,
    ),
    check(
      'service_packages_price_satang_nonnegative',
      sql`${table.priceSatang} >= 0`,
    ),
    check(
      'service_packages_duration_minutes_positive',
      sql`${table.durationMinutes} > 0`,
    ),
  ],
);

export const serviceImages = pgTable(
  'service_images',
  {
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
    carouselIndex: integer('carousel_index').notNull(),
    objectKey: varchar('object_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.serviceId, table.carouselIndex] }),
    check(
      'service_images_carousel_index_nonnegative',
      sql`${table.carouselIndex} >= 0`,
    ),
  ],
);
