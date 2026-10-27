import type { DrizzleDB } from '@/database/database.module';
import {
  advisorProfileTranslations,
  notificationTranslations,
  screeningQuestionTranslations,
  serviceCategoryTranslations,
  serviceTranslations,
  skillTranslations,
  type ContentLocale,
} from '@/database/schema';
import { currentLocale, DEFAULT_LOCALE } from './request-locale';

/**
 * Writing translated content. The rule every write follows:
 *
 * - **Creating** a row writes its text to the parent's own columns (the
 *   fallback for a language with no row) and to the translation row for the
 *   language it was written in (`currentLocale()`).
 * - **Changing** the text writes the translation row for the language it was
 *   changed in, and the parent's columns only when that language is Thai, the
 *   source (`writesSourceText()`). An edit made in English leaves the Thai as
 *   it was, rather than overwriting it with English.
 *
 * Every helper takes the full text of its fields in that language (merge the
 * current values in before calling for a partial edit), and upserts on the
 * translation's (parent, locale) key. `db` may be a transaction.
 */
type Writer = Pick<DrizzleDB, 'insert'>;

/** Whether a change should also go to the parent's own columns: only in the source language. */
export function writesSourceText(
  locale: ContentLocale = currentLocale(),
): boolean {
  return locale === DEFAULT_LOCALE;
}

export async function saveServiceTranslation(
  db: Writer,
  serviceId: string,
  text: { readonly name: string; readonly description: string | null },
  locale: ContentLocale = currentLocale(),
): Promise<void> {
  await db
    .insert(serviceTranslations)
    .values({ serviceId, locale, ...text })
    .onConflictDoUpdate({
      target: [serviceTranslations.serviceId, serviceTranslations.locale],
      set: text,
    });
}

export async function saveCategoryTranslation(
  db: Writer,
  categoryId: string,
  text: { readonly name: string; readonly description: string | null },
  locale: ContentLocale = currentLocale(),
): Promise<void> {
  await db
    .insert(serviceCategoryTranslations)
    .values({ categoryId, locale, ...text })
    .onConflictDoUpdate({
      target: [
        serviceCategoryTranslations.categoryId,
        serviceCategoryTranslations.locale,
      ],
      set: text,
    });
}

export async function saveSkillTranslation(
  db: Writer,
  skillId: string,
  text: { readonly name: string; readonly description: string | null },
  locale: ContentLocale = currentLocale(),
): Promise<void> {
  await db
    .insert(skillTranslations)
    .values({ skillId, locale, ...text })
    .onConflictDoUpdate({
      target: [skillTranslations.skillId, skillTranslations.locale],
      set: text,
    });
}

export async function saveAdvisorProfileTranslation(
  db: Writer,
  advisorId: string,
  text: { readonly headline: string; readonly bio: string | null },
  locale: ContentLocale = currentLocale(),
): Promise<void> {
  await db
    .insert(advisorProfileTranslations)
    .values({ advisorId, locale, ...text })
    .onConflictDoUpdate({
      target: [
        advisorProfileTranslations.advisorId,
        advisorProfileTranslations.locale,
      ],
      set: text,
    });
}

export async function saveScreeningQuestionTranslation(
  db: Writer,
  questionId: string,
  question: string,
  locale: ContentLocale = currentLocale(),
): Promise<void> {
  await db
    .insert(screeningQuestionTranslations)
    .values({ questionId, locale, question })
    .onConflictDoUpdate({
      target: [
        screeningQuestionTranslations.questionId,
        screeningQuestionTranslations.locale,
      ],
      set: { question },
    });
}

/**
 * A notification in every language it was written in at once: the system
 * writes notifications, not a reader, so each one is written in Thai and in
 * English when it is created, and shows in whichever the reader uses.
 */
export async function saveNotificationTranslations(
  db: Writer,
  notificationId: string,
  texts: Partial<
    Record<
      ContentLocale,
      { readonly title: string; readonly content: string | null }
    >
  >,
): Promise<void> {
  const rows = (
    Object.entries(texts) as [
      ContentLocale,
      { title: string; content: string | null },
    ][]
  ).map(([locale, text]) => ({ notificationId, locale, ...text }));
  if (rows.length === 0) return;
  for (const row of rows) {
    await db
      .insert(notificationTranslations)
      .values(row)
      .onConflictDoUpdate({
        target: [
          notificationTranslations.notificationId,
          notificationTranslations.locale,
        ],
        set: { title: row.title, content: row.content },
      });
  }
}
