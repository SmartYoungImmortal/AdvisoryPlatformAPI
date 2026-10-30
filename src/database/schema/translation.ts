import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  advisorProfiles,
  notifications,
  serviceCategories,
  servicePackages,
  serviceScreeningQuestions,
  services,
  skills,
} from '@/database/schema';

/**
 * The languages the platform's content is written in. Thai is the source: a
 * parent row keeps its text in its own columns, and each translation row holds
 * the same fields in one language, keyed by (parent, locale).
 *
 * Only text a reader sees in their own language lives here: names and
 * descriptions of the taxonomy, a Service's and its packages' names and descriptions, an
 * Advisor's headline and bio, a screening question, and a notification.
 * People's names, chat, reviews, answers and moderation reasons are written by
 * someone in one language and are shown as written, so they stay on the parent.
 *
 * The parent's own columns stay for now as the fallback for a locale with no
 * row; a later migration can drop them once every read and write goes through
 * these tables.
 */
export const contentLocaleEnum = pgEnum('content_locale', ['th', 'en']);

export type ContentLocale = (typeof contentLocaleEnum.enumValues)[number];

export const serviceCategoryTranslations = pgTable(
  'service_category_translations',
  {
    categoryId: uuid('category_id')
      .notNull()
      .references(() => serviceCategories.id, { onDelete: 'cascade' }),
    locale: contentLocaleEnum('locale').notNull(),
    name: varchar('name').notNull(),
    description: text('description'),
  },
  (table) => [primaryKey({ columns: [table.categoryId, table.locale] })],
);

export const skillTranslations = pgTable(
  'skill_translations',
  {
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    locale: contentLocaleEnum('locale').notNull(),
    name: varchar('name').notNull(),
    description: text('description'),
  },
  (table) => [primaryKey({ columns: [table.skillId, table.locale] })],
);

export const serviceTranslations = pgTable(
  'service_translations',
  {
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    locale: contentLocaleEnum('locale').notNull(),
    name: varchar('name').notNull(),
    description: text('description'),
  },
  (table) => [primaryKey({ columns: [table.serviceId, table.locale] })],
);

/** A package's name and line, as a service's are. */
export const servicePackageTranslations = pgTable(
  'service_package_translations',
  {
    packageId: uuid('package_id')
      .notNull()
      .references(() => servicePackages.id, { onDelete: 'cascade' }),
    locale: contentLocaleEnum('locale').notNull(),
    name: varchar('name').notNull(),
    description: text('description'),
  },
  (table) => [primaryKey({ columns: [table.packageId, table.locale] })],
);

export const advisorProfileTranslations = pgTable(
  'advisor_profile_translations',
  {
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId, { onDelete: 'cascade' }),
    locale: contentLocaleEnum('locale').notNull(),
    headline: varchar('headline').notNull(),
    bio: text('bio'),
  },
  (table) => [primaryKey({ columns: [table.advisorId, table.locale] })],
);

export const screeningQuestionTranslations = pgTable(
  'screening_question_translations',
  {
    questionId: uuid('question_id')
      .notNull()
      .references(() => serviceScreeningQuestions.id, { onDelete: 'cascade' }),
    locale: contentLocaleEnum('locale').notNull(),
    question: text('question').notNull(),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.locale] })],
);

export const notificationTranslations = pgTable(
  'notification_translations',
  {
    notificationId: uuid('notification_id')
      .notNull()
      .references(() => notifications.id, { onDelete: 'cascade' }),
    locale: contentLocaleEnum('locale').notNull(),
    title: varchar('title').notNull(),
    content: text('content'),
  },
  (table) => [primaryKey({ columns: [table.notificationId, table.locale] })],
);
