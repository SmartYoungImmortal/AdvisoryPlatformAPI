/**
 * The four CRUD messages every module ends up needing, derived from the entity noun so the
 * noun is written once. Returns template-literal types, not `string`, so a typo'd lookup
 * (`.notfound`) is a compile error rather than an `undefined` that reaches the wire as
 * better-auth's generic fallback message.
 */
export function crudMessages<T extends string>(entity: T) {
  return {
    notFound: `${entity} not found`,
    created: `${entity} created`,
    updated: `${entity} updated`,
    deleted: `${entity} deleted`,
  } as const;
}
