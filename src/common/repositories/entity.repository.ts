import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';
import { asc, count, eq } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { DrizzleDB } from '@/database/database.module';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';

export type TableWithId = PgTable & { id: AnyPgColumn };

export abstract class EntityRepository<TTable extends TableWithId> {
  protected constructor(
    protected readonly db: DrizzleDB,
    protected readonly table: TTable,
  ) {}

  /**
   * Drizzle's `.from()`/`.returning()` builder types gate on a conditional type
   * (`TableLikeHasEmptySelection`) that TypeScript cannot resolve against an unbound
   * generic `TTable`. Widening to the concrete `PgTable` base class at the query-builder
   * boundary resolves that conditional; row shapes are recovered immediately after via
   * `InferSelectModel<TTable>`, so callers never see anything but the concrete row type.
   */
  private get queryTable(): PgTable {
    return this.table;
  }

  async findOne(where: SQL): Promise<InferSelectModel<TTable> | undefined> {
    const [row] = await this.db
      .select()
      .from(this.queryTable)
      .where(where)
      .limit(1);
    return row as InferSelectModel<TTable> | undefined;
  }

  async findMany(
    where?: SQL,
    options?: { limit?: number; offset?: number },
  ): Promise<InferSelectModel<TTable>[]> {
    let query = this.db
      .select()
      .from(this.queryTable)
      .orderBy(asc(this.table.id))
      .$dynamic();

    if (where) {
      query = query.where(where);
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    const rows = await query;
    return rows as InferSelectModel<TTable>[];
  }

  findById(id: string): Promise<InferSelectModel<TTable> | undefined> {
    return this.findOne(eq(this.table.id, id));
  }

  async create(
    values: InferInsertModel<TTable>,
  ): Promise<InferSelectModel<TTable>> {
    const rows = await this.db.insert(this.table).values(values).returning();
    return (rows as InferSelectModel<TTable>[])[0];
  }

  async createMany(
    values: InferInsertModel<TTable>[],
  ): Promise<InferSelectModel<TTable>[]> {
    const rows = await this.db.insert(this.table).values(values).returning();
    return rows as InferSelectModel<TTable>[];
  }

  async updateWhere(
    where: SQL,
    values: PgUpdateSetSource<TTable>,
  ): Promise<InferSelectModel<TTable>[]> {
    const rows = await this.db
      .update(this.table)
      .set(values)
      .where(where)
      .returning();
    return rows as InferSelectModel<TTable>[];
  }

  async updateById(
    id: string,
    values: PgUpdateSetSource<TTable>,
  ): Promise<InferSelectModel<TTable> | undefined> {
    const [row] = await this.updateWhere(eq(this.table.id, id), values);
    return row;
  }

  async deleteWhere(where: SQL): Promise<InferSelectModel<TTable>[]> {
    const rows = await this.db.delete(this.table).where(where).returning();
    return rows as InferSelectModel<TTable>[];
  }

  async deleteById(id: string): Promise<InferSelectModel<TTable> | undefined> {
    const [row] = await this.deleteWhere(eq(this.table.id, id));
    return row;
  }

  async count(where?: SQL): Promise<number> {
    const query = this.db.select({ value: count() }).from(this.queryTable);
    const [row] = where ? await query.where(where) : await query;
    return row?.value ?? 0;
  }
}
