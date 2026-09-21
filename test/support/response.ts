/**
 * Narrowing helpers for untyped JSON bodies, so e2e specs can read a response
 * without `any` and fail with a readable message when the shape is wrong.
 */
export function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected an object response');
  }
  return value as Record<string, unknown>;
}

/** Unwraps the envelope every `/api/v1` response wraps its payload in. */
export function data(body: unknown): Record<string, unknown> {
  return object(object(body).data);
}

export function stringField(
  source: Record<string, unknown>,
  key: string,
): string {
  const value = source[key];
  if (typeof value !== 'string') {
    throw new Error(`Expected ${key} to be a string`);
  }
  return value;
}
