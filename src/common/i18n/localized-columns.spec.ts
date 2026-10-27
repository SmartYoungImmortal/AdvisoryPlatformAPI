import { PgDialect } from 'drizzle-orm/pg-core';
import { runWithLocale } from './request-locale';
import { categoryName, serviceName } from './localized-columns';

describe('localized columns', () => {
  const dialect = new PgDialect();

  it('names both tables in full, so the subquery cannot bind to the wrong one', () => {
    const { sql } = dialect.sqlToQuery(serviceName());
    expect(sql).toContain(
      '"service_translations"."service_id" = "services"."id"',
    );
    expect(sql).toContain('"service_translations"."locale" = $1');
    expect(sql).toMatch(/,\s*"services"\."name"\)$/);
  });

  it("asks for the request's language, Thai outside a request", () => {
    expect(dialect.sqlToQuery(categoryName()).params).toEqual(['th']);
    const english = runWithLocale('en', () =>
      dialect.sqlToQuery(categoryName()),
    );
    expect(english.params).toEqual(['en']);
  });
});
