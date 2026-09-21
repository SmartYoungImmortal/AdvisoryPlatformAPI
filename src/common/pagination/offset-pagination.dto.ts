import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class OffsetPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  pagination: OffsetPaginationDto,
): PaginatedResult<T> {
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

/** Executes the standard offset list/count pair and maps rows into an allowlisted response. */
export async function paginateQuery<TRow, TResult>(
  pagination: OffsetPaginationDto,
  find: (options: { limit: number; offset: number }) => Promise<TRow[]>,
  count: () => Promise<number>,
  map: (row: TRow) => TResult,
): Promise<PaginatedResult<TResult>> {
  const [items, total] = await Promise.all([
    find({ limit: pagination.limit, offset: pagination.offset }),
    count(),
  ]);
  return paginate(items.map(map), total, pagination);
}
