import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { advisorProfiles } from './advisor';

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  advisorId: uuid('advisor_id')
    .notNull()
    .references(() => advisorProfiles.userId),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => serviceCategories.id),
  name: varchar('name').notNull(),
  description: text('description'),
  priceSatang: integer('price_satang').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  // Independent switches — booking requires neither. See docs/ER.README.md.
  screeningRequired: boolean('screening_required').notNull().default(false),
  trialEnabled: boolean('trial_enabled').notNull().default(false),
  // Null unless trialEnabled.
  trialDurationMinutes: integer('trial_duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
  (table) => [primaryKey({ columns: [table.serviceId, table.carouselIndex] })],
);
