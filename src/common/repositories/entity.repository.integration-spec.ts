import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import { EntityRepository } from './entity.repository';
import type { DrizzleDB } from '../../database/database.module';
import * as schema from '../../database/schema';

const widgets = pgTable('_test_widgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  stock: integer('stock').notNull().default(0),
});

class WidgetRepository extends EntityRepository<typeof widgets> {
  constructor(db: DrizzleDB) {
    super(db, widgets);
  }
}

describe('EntityRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repo: WidgetRepository;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    repo = new WidgetRepository(db);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS _test_widgets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        stock integer NOT NULL DEFAULT 0
      )
    `);
  });

  afterEach(async () => {
    await db.execute(`TRUNCATE TABLE _test_widgets`);
  });

  afterAll(async () => {
    await db.execute(`DROP TABLE IF EXISTS _test_widgets`);
    await pool.end();
  });

  it('creates a row and finds it by id', async () => {
    const created = await repo.create({ name: 'Widget A', stock: 5 });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Widget A');

    const found = await repo.findById(created.id);
    expect(found?.name).toBe('Widget A');
  });

  it('returns undefined for a missing id', async () => {
    const found = await repo.findById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeUndefined();
  });

  it('findMany returns all rows, filtered when a where clause is given', async () => {
    await repo.createMany([
      { name: 'Widget A', stock: 5 },
      { name: 'Widget B', stock: 0 },
    ]);

    const all = await repo.findMany();
    expect(all).toHaveLength(2);

    const outOfStock = await repo.findMany(eq(widgets.stock, 0));
    expect(outOfStock).toHaveLength(1);
    expect(outOfStock[0].name).toBe('Widget B');
  });

  it('updates a row by id', async () => {
    const created = await repo.create({ name: 'Widget A', stock: 5 });
    const updated = await repo.updateById(created.id, { stock: 10 });

    expect(updated?.stock).toBe(10);
  });

  it('deletes a row by id', async () => {
    const created = await repo.create({ name: 'Widget A', stock: 5 });
    const deleted = await repo.deleteById(created.id);

    expect(deleted?.id).toBe(created.id);
    expect(await repo.findById(created.id)).toBeUndefined();
  });

  it('findMany paginates via limit/offset', async () => {
    await repo.createMany([
      { name: 'Widget A', stock: 5 },
      { name: 'Widget B', stock: 0 },
      { name: 'Widget C', stock: 2 },
    ]);

    const firstPage = await repo.findMany(undefined, { limit: 2, offset: 0 });
    const secondPage = await repo.findMany(undefined, { limit: 2, offset: 2 });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
  });

  it('counts rows, optionally filtered', async () => {
    await repo.createMany([
      { name: 'Widget A', stock: 5 },
      { name: 'Widget B', stock: 0 },
    ]);

    expect(await repo.count()).toBe(2);
    expect(await repo.count(eq(widgets.stock, 0))).toBe(1);
  });
});
