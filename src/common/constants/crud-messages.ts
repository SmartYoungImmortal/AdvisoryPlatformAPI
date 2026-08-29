export function crudMessages<T extends string>(entity: T) {
  return {
    notFound: `${entity} not found`,
    created: `${entity} created`,
    updated: `${entity} updated`,
    deleted: `${entity} deleted`,
  } as const;
}
