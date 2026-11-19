/**
 * True if the error is a Postgres unique violation (code 23505), either directly or in its `cause`.
 */
export function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown): unknown =>
    typeof value === 'object' && value !== null && 'code' in value
      ? value.code
      : undefined;
  const cause =
    typeof error === 'object' && error !== null && 'cause' in error
      ? error.cause
      : undefined;
  return code(error) === '23505' || code(cause) === '23505';
}
