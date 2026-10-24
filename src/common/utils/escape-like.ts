/**
 * `value` safe inside a SQL `LIKE` / `ILIKE` pattern: the backslash and both
 * wildcards (`%`, `_`) escaped, so a search for "50%" matches that text rather
 * than everything starting with "50". Postgres's default escape character is
 * the backslash, so no `ESCAPE` clause is needed.
 */
export function escapeLike(value: string): string {
  return value.replaceAll(/[\\%_]/g, String.raw`\$&`);
}
