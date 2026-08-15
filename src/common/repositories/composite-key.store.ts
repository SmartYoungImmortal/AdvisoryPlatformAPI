import {
  and,
  eq,
  type GetColumnData,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { DrizzleDB } from '@/database/database.module';

type CompositeKeyColumns = Readonly<Record<string, AnyPgColumn>>;

export type CompositeKeyValues<TColumns extends CompositeKeyColumns> = {
  [TKey in keyof TColumns]: GetColumnData<TColumns[TKey], 'raw'>;
};

/**
 * Mechanical operations shared by junction tables. Feature repositories compose this store and
 * retain named methods for authorization, transactions, joins, and relationship-specific rules.
 */
export class CompositeKeyStore<
  TTable extends PgTable,
  TColumns extends CompositeKeyColumns,
> {
  constructor(
    private readonly db: DrizzleDB,
    private readonly table: TTable,
    private readonly keyColumns: TColumns,
  ) {
    if (Object.keys(keyColumns).length < 2) {
      throw new Error('CompositeKeyStore requires at least two key columns');
    }
  }

  private get queryTable(): PgTable {
    return this.table;
  }

  where(key: CompositeKeyValues<TColumns>): SQL {
    const conditions = (
      Object.keys(this.keyColumns) as Array<keyof TColumns>
    ).map((keyName) => eq(this.keyColumns[keyName], key[keyName]));
    return and(...conditions) as SQL;
  }

  async find(
    key: CompositeKeyValues<TColumns>,
  ): Promise<InferSelectModel<TTable> | undefined> {
    const [row] = await this.db
      .select()
      .from(this.queryTable)
      .where(this.where(key))
      .limit(1);
    return row as InferSelectModel<TTable> | undefined;
  }

  async exists(key: CompositeKeyValues<TColumns>): Promise<boolean> {
    const row = await this.find(key);
    return row !== undefined;
  }

  async create(
    values: InferInsertModel<TTable>,
  ): Promise<InferSelectModel<TTable>> {
    const [row] = await this.db.insert(this.table).values(values).returning();
    return row as InferSelectModel<TTable>;
  }

  async delete(
    key: CompositeKeyValues<TColumns>,
  ): Promise<InferSelectModel<TTable> | undefined> {
    const [row] = await this.db
      .delete(this.table)
      .where(this.where(key))
      .returning();
    return row as InferSelectModel<TTable> | undefined;
  }
}
