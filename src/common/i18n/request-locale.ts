import { AsyncLocalStorage } from 'node:async_hooks';
import type { ContentLocale } from '@/database/schema';

/** Thai is the platform's source language, and the answer when nothing asks for another. */
export const DEFAULT_LOCALE: ContentLocale = 'th';

const storage = new AsyncLocalStorage<ContentLocale>();

/**
 * The content language a request asks for, from its `Accept-Language`: English
 * when the first tag is English, Thai otherwise. The web app sends the language
 * the reader chose, not the browser's own list, so the first tag is the answer;
 * a client that sends nothing gets Thai.
 */
export function localeFromHeader(
  header: string | string[] | undefined,
): ContentLocale {
  const value = Array.isArray(header) ? header[0] : header;
  const first = value?.split(',', 1)[0]?.trim().toLowerCase() ?? '';
  return first === 'en' || first.startsWith('en-') ? 'en' : DEFAULT_LOCALE;
}

/** Runs `fn` with `locale` as the current request's language. */
export function runWithLocale<T>(locale: ContentLocale, fn: () => T): T {
  return storage.run(locale, fn);
}

/**
 * The language of the request being served. Read where content is selected or
 * written, so repositories need no locale argument threaded through every
 * service. Outside a request (a job, a socket event, a test), Thai.
 */
export function currentLocale(): ContentLocale {
  return storage.getStore() ?? DEFAULT_LOCALE;
}

/**
 * Express middleware: every request runs in the language its `Accept-Language`
 * asks for. Registered first in `configureApp`, so everything after it (Nest's
 * guards, pipes and handlers) sees the same store.
 */
export function requestLocaleMiddleware(
  req: { headers: Record<string, string | string[] | undefined> },
  _res: unknown,
  next: () => void,
): void {
  runWithLocale(localeFromHeader(req.headers['accept-language']), next);
}
