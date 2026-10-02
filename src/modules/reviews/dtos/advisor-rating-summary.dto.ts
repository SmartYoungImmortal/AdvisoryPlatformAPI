import { ApiProperty } from '@nestjs/swagger';
import { REVIEW_STARS_MAX, REVIEW_STARS_MIN } from '../reviews.constants';

export class RatingDistributionDto {
  @ApiProperty({ minimum: REVIEW_STARS_MIN, maximum: REVIEW_STARS_MAX })
  stars: number;
  @ApiProperty() count: number;

  constructor(stars: number, count: number) {
    this.stars = stars;
    this.count = count;
  }
}

/**
 * The headline an Advisor's review list is read through: one score, one count, and the bar per
 * star value. `distribution` always carries all five entries, highest first, so a client renders
 * five bars without filling in the gaps itself — a star nobody has given is a zero, not a missing
 * key.
 */
export class AdvisorRatingSummaryDto {
  /**
   * Rounded to one decimal, which is the precision this rating is displayed at. Rounding here
   * rather than in each client is what stops two clients disagreeing about the same advisor.
   * Null when there is nothing to average.
   */
  @ApiProperty({ nullable: true, type: Number }) average: number | null;
  @ApiProperty() total: number;
  @ApiProperty({ type: [RatingDistributionDto] })
  distribution: RatingDistributionDto[];

  constructor(countsByStars: ReadonlyMap<number, number>) {
    const stars = descendingStarValues();
    this.distribution = stars.map(
      (value) =>
        new RatingDistributionDto(value, countsByStars.get(value) ?? 0),
    );
    this.total = this.distribution.reduce((sum, row) => sum + row.count, 0);
    this.average =
      this.total === 0
        ? null
        : roundToOneDecimal(
            this.distribution.reduce(
              (sum, row) => sum + row.stars * row.count,
              0,
            ) / this.total,
          );
  }
}

function descendingStarValues(): number[] {
  const values: number[] = [];
  for (let star = REVIEW_STARS_MAX; star >= REVIEW_STARS_MIN; star -= 1) {
    values.push(star);
  }
  return values;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
