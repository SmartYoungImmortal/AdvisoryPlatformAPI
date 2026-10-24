import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { AdvisorRatingSummaryDto } from './advisor-rating-summary.dto';

/** How many advisors one batch may ask about: a directory page is at most this long. */
export const RATING_SUMMARIES_MAX_IDS = 100;

/** `?ids=a,b,c` — the advisors to summarise, comma-separated. */
export class AdvisorRatingSummariesQueryDto {
  @ApiProperty({
    description: `Advisor ids, comma-separated (at most ${RATING_SUMMARIES_MAX_IDS}).`,
    type: String,
    example:
      '97377457-0366-467d-b036-c2a00f0fb85e,aab4a7ea-9aba-4de2-8809-be0974411760',
  })
  @Transform(({ value }: TransformFnParams) => {
    const input: unknown = value;
    return typeof input === 'string'
      ? [
          ...new Set(
            input
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean),
          ),
        ]
      : input;
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(RATING_SUMMARIES_MAX_IDS)
  @IsUUID('all', { each: true })
  ids!: string[];
}

/** One advisor's summary in a batch: the same numbers `GET /advisors/:id/reviews/summary` gives. */
export class AdvisorRatingSummaryItemDto extends AdvisorRatingSummaryDto {
  @ApiProperty({ format: 'uuid' }) advisorId: string;

  constructor(advisorId: string, countsByStars: ReadonlyMap<number, number>) {
    super(countsByStars);
    this.advisorId = advisorId;
  }
}

/**
 * The summaries for a list of advisors in one answer, so a directory page asks once instead of
 * once per advisor. An advisor the public routes would not acknowledge (unknown, suspended,
 * banned) is left out rather than failing the batch — where the single route answers 404.
 */
export class AdvisorRatingSummariesDto {
  @ApiProperty({ type: [AdvisorRatingSummaryItemDto] })
  items: AdvisorRatingSummaryItemDto[];

  constructor(items: AdvisorRatingSummaryItemDto[]) {
    this.items = items;
  }
}
