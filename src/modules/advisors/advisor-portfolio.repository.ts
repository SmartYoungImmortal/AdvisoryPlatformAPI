import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { advisorPortfolioItems, advisorProfiles } from '@/database/schema';
import {
  PORTFOLIO_IMAGES_MAX,
  PORTFOLIO_ITEMS_MAX,
} from './dtos/advisor-portfolio.dto';

export type PortfolioItemRow = typeof advisorPortfolioItems.$inferSelect;

/** The words of a piece, as they are written; pictures are added and taken one at a time. */
export interface PortfolioItemValues {
  title: string;
  description: string | null;
  link: string | null;
}

export const PORTFOLIO_MESSAGES = {
  notFound: 'Portfolio item not found',
  imageNotFound: 'Portfolio image not found',
  full: `A profile shows at most ${PORTFOLIO_ITEMS_MAX} pieces of work`,
  imagesFull: `A piece of work has at most ${PORTFOLIO_IMAGES_MAX} pictures`,
  orderMismatch: 'The order must list every piece of work once',
} as const;

/** An Advisor's pieces of work (`advisor_portfolio_items`), each kept by its id. */
@Injectable()
export class AdvisorPortfolioRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** The Advisor's pieces in the order their profile shows them. */
  list(advisorId: string): Promise<PortfolioItemRow[]> {
    return this.db
      .select()
      .from(advisorPortfolioItems)
      .where(eq(advisorPortfolioItems.advisorId, advisorId))
      .orderBy(
        asc(advisorPortfolioItems.sortOrder),
        asc(advisorPortfolioItems.createdAt),
      );
  }

  /**
   * A new piece goes last. The Advisor's profile row is locked first, so two pieces added at
   * once are counted one after the other, even while there are none yet.
   */
  create(
    advisorId: string,
    values: PortfolioItemValues,
  ): Promise<PortfolioItemRow> {
    return this.db.transaction(async (tx) => {
      await tx
        .select({ userId: advisorProfiles.userId })
        .from(advisorProfiles)
        .where(eq(advisorProfiles.userId, advisorId))
        .for('update');
      const existing = await tx
        .select({ sortOrder: advisorPortfolioItems.sortOrder })
        .from(advisorPortfolioItems)
        .where(eq(advisorPortfolioItems.advisorId, advisorId));
      if (existing.length >= PORTFOLIO_ITEMS_MAX)
        throw new BadRequestException(PORTFOLIO_MESSAGES.full);
      const last = Math.max(-1, ...existing.map((row) => row.sortOrder));
      const [row] = await tx
        .insert(advisorPortfolioItems)
        .values({ ...values, advisorId, sortOrder: last + 1 })
        .returning();
      return row;
    });
  }

  async update(
    advisorId: string,
    itemId: string,
    changes: Partial<PortfolioItemValues>,
  ): Promise<PortfolioItemRow> {
    const [row] = await this.db
      .update(advisorPortfolioItems)
      .set(changes)
      .where(this.ownedWhere(advisorId, itemId))
      .returning();
    if (!row) throw new NotFoundException(PORTFOLIO_MESSAGES.notFound);
    return row;
  }

  /** Takes the piece away and answers it, so its stored pictures can go too. */
  async remove(advisorId: string, itemId: string): Promise<PortfolioItemRow> {
    const [row] = await this.db
      .delete(advisorPortfolioItems)
      .where(this.ownedWhere(advisorId, itemId))
      .returning();
    if (!row) throw new NotFoundException(PORTFOLIO_MESSAGES.notFound);
    return row;
  }

  /**
   * Adds a picture after the others in one statement, so two uploads at once cannot both take
   * the last place; the table's check refuses a fifth regardless.
   */
  async appendImage(
    advisorId: string,
    itemId: string,
    key: string,
  ): Promise<PortfolioItemRow> {
    const [row] = await this.db
      .update(advisorPortfolioItems)
      .set({
        imageKeys: sql`array_append(${advisorPortfolioItems.imageKeys}, ${key})`,
      })
      .where(
        and(
          this.ownedWhere(advisorId, itemId),
          sql`coalesce(array_length(${advisorPortfolioItems.imageKeys}, 1), 0) < ${PORTFOLIO_IMAGES_MAX}`,
        ),
      )
      .returning();
    if (row) return row;
    await this.findOwned(advisorId, itemId);
    throw new BadRequestException(PORTFOLIO_MESSAGES.imagesFull);
  }

  /** Takes out the picture at `index`; answers the piece as it is now and the key taken out. */
  removeImage(
    advisorId: string,
    itemId: string,
    index: number,
  ): Promise<{ row: PortfolioItemRow; key: string }> {
    return this.db.transaction(async (tx) => {
      const [owned] = await tx
        .select()
        .from(advisorPortfolioItems)
        .where(this.ownedWhere(advisorId, itemId))
        .for('update');
      if (!owned) throw new NotFoundException(PORTFOLIO_MESSAGES.notFound);
      const key = owned.imageKeys[index];
      if (key === undefined)
        throw new NotFoundException(PORTFOLIO_MESSAGES.imageNotFound);
      const [row] = await tx
        .update(advisorPortfolioItems)
        .set({ imageKeys: owned.imageKeys.filter((_, at) => at !== index) })
        .where(eq(advisorPortfolioItems.id, itemId))
        .returning();
      return { row, key };
    });
  }

  /** Puts the pieces in the order given, which must name each of them exactly once. */
  async reorder(advisorId: string, ids: readonly string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: advisorPortfolioItems.id })
        .from(advisorPortfolioItems)
        .where(eq(advisorPortfolioItems.advisorId, advisorId))
        .for('update');
      const known = new Set(rows.map((row) => row.id));
      const named = new Set(ids);
      if (
        named.size !== ids.length ||
        named.size !== known.size ||
        ids.some((id) => !known.has(id))
      )
        throw new BadRequestException(PORTFOLIO_MESSAGES.orderMismatch);
      for (const [sortOrder, id] of ids.entries()) {
        await tx
          .update(advisorPortfolioItems)
          .set({ sortOrder })
          .where(eq(advisorPortfolioItems.id, id));
      }
    });
  }

  async findOwned(
    advisorId: string,
    itemId: string,
  ): Promise<PortfolioItemRow> {
    const [row] = await this.db
      .select()
      .from(advisorPortfolioItems)
      .where(this.ownedWhere(advisorId, itemId));
    if (!row) throw new NotFoundException(PORTFOLIO_MESSAGES.notFound);
    return row;
  }

  private ownedWhere(advisorId: string, itemId: string) {
    return and(
      eq(advisorPortfolioItems.id, itemId),
      eq(advisorPortfolioItems.advisorId, advisorId),
    );
  }
}
