import { getColumnTable, getTableName, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  advisorProfileTranslations,
  advisorProfiles,
  notificationTranslations,
  notifications,
  screeningQuestionTranslations,
  serviceCategories,
  serviceCategoryTranslations,
  servicePackageTranslations,
  servicePackages,
  serviceScreeningQuestions,
  serviceTranslations,
  services,
  skillTranslations,
  skills,
} from '@/database/schema';
import { currentLocale } from './request-locale';

/**
 * A column as `"table"."column"`, whatever query it lands in. Drizzle drops
 * the table name from columns in a query over one table (and in `returning`),
 * which inside the subquery below would turn `"translations"."key" =
 * "parent"."id"` into `"key" = "id"`: correct today only because no
 * translation table has an `id` of its own, and silently wrong the day one
 * does. Spelling both sides out takes the guess away. (None of these parent
 * tables is aliased anywhere, which spelling the name out would break.)
 */
function qualified(column: AnyPgColumn): SQL {
  return sql`${sql.identifier(tableOf(column))}.${sql.identifier(column.name)}`;
}

/** The name of the table a column belongs to. */
function tableOf(column: AnyPgColumn): string {
  // `getTableName` is typed off the table's generic, which `getColumnTable`
  // leaves as `any`; the value is the table's name either way.
  return String(getTableName(getColumnTable(column)));
}

/**
 * One translated field, in the request's language: the translation row's value
 * for `currentLocale()`, or the parent's own column when there is no such row
 * (the parent keeps the source text). A correlated subquery on the
 * translation's primary key, so it drops into any `select({...})` in place of
 * the parent column, joins or not, and reads one indexed row.
 *
 * `table` is passed for its `locale` column; `key` is the translation's
 * foreign key, `parentKey` what it points at.
 */
function localized<T>(
  table: { locale: AnyPgColumn },
  key: AnyPgColumn,
  value: AnyPgColumn,
  parentKey: AnyPgColumn,
  fallback: AnyPgColumn,
): SQL<T> {
  return sql<T>`coalesce((select ${qualified(value)} from ${sql.identifier(tableOf(value))} where ${qualified(key)} = ${qualified(parentKey)} and ${qualified(table.locale)} = ${currentLocale()}), ${qualified(fallback)})`;
}

/** A Service's name, in the request's language. */
export const serviceName = (): SQL<string> =>
  localized(
    serviceTranslations,
    serviceTranslations.serviceId,
    serviceTranslations.name,
    services.id,
    services.name,
  );

/** A Service's description, in the request's language. */
export const serviceDescription = (): SQL<string | null> =>
  localized(
    serviceTranslations,
    serviceTranslations.serviceId,
    serviceTranslations.description,
    services.id,
    services.description,
  );

/** A package's name, in the request's language. */
export const packageName = (): SQL<string> =>
  localized(
    servicePackageTranslations,
    servicePackageTranslations.packageId,
    servicePackageTranslations.name,
    servicePackages.id,
    servicePackages.name,
  );

/** A package's description, in the request's language. */
export const packageDescription = (): SQL<string | null> =>
  localized(
    servicePackageTranslations,
    servicePackageTranslations.packageId,
    servicePackageTranslations.description,
    servicePackages.id,
    servicePackages.description,
  );

/** A category's name, in the request's language. */
export const categoryName = (): SQL<string> =>
  localized(
    serviceCategoryTranslations,
    serviceCategoryTranslations.categoryId,
    serviceCategoryTranslations.name,
    serviceCategories.id,
    serviceCategories.name,
  );

/** A category's description, in the request's language. */
export const categoryDescription = (): SQL<string | null> =>
  localized(
    serviceCategoryTranslations,
    serviceCategoryTranslations.categoryId,
    serviceCategoryTranslations.description,
    serviceCategories.id,
    serviceCategories.description,
  );

/** A skill's name, in the request's language. */
export const skillName = (): SQL<string> =>
  localized(
    skillTranslations,
    skillTranslations.skillId,
    skillTranslations.name,
    skills.id,
    skills.name,
  );

/** A skill's description, in the request's language. */
export const skillDescription = (): SQL<string | null> =>
  localized(
    skillTranslations,
    skillTranslations.skillId,
    skillTranslations.description,
    skills.id,
    skills.description,
  );

/** An Advisor's headline, in the request's language. */
export const advisorHeadline = (): SQL<string> =>
  localized(
    advisorProfileTranslations,
    advisorProfileTranslations.advisorId,
    advisorProfileTranslations.headline,
    advisorProfiles.userId,
    advisorProfiles.headline,
  );

/** An Advisor's bio, in the request's language. */
export const advisorBio = (): SQL<string | null> =>
  localized(
    advisorProfileTranslations,
    advisorProfileTranslations.advisorId,
    advisorProfileTranslations.bio,
    advisorProfiles.userId,
    advisorProfiles.bio,
  );

/** A screening question, in the request's language. */
export const screeningQuestionText = (): SQL<string> =>
  localized(
    screeningQuestionTranslations,
    screeningQuestionTranslations.questionId,
    screeningQuestionTranslations.question,
    serviceScreeningQuestions.id,
    serviceScreeningQuestions.question,
  );

/** A notification's title, in the request's language. */
export const notificationTitle = (): SQL<string> =>
  localized(
    notificationTranslations,
    notificationTranslations.notificationId,
    notificationTranslations.title,
    notifications.id,
    notifications.title,
  );

/** A notification's content, in the request's language. */
export const notificationContent = (): SQL<string | null> =>
  localized(
    notificationTranslations,
    notificationTranslations.notificationId,
    notificationTranslations.content,
    notifications.id,
    notifications.content,
  );
