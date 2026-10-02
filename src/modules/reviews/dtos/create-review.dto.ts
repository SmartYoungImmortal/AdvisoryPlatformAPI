import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import {
  REVIEW_STARS_MAX,
  REVIEW_STARS_MIN,
  REVIEW_TEXT_MAX_LENGTH,
} from '../reviews.constants';

export class CreateReviewDto {
  @ApiProperty({ minimum: REVIEW_STARS_MIN, maximum: REVIEW_STARS_MAX })
  @IsInt()
  @Min(REVIEW_STARS_MIN)
  @Max(REVIEW_STARS_MAX)
  stars!: number;

  /** The star rating stands on its own; the written comment is what is optional. */
  @ApiPropertyOptional({ maxLength: REVIEW_TEXT_MAX_LENGTH })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(REVIEW_TEXT_MAX_LENGTH)
  comment?: string;
}
