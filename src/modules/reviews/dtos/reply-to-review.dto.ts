import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { REVIEW_TEXT_MAX_LENGTH } from '../reviews.constants';

export class ReplyToReviewDto {
  /**
   * Writing this route is how an Advisor replies and how they change a reply they have already
   * written. Clearing one is not a case this route serves — a blank body is a mistake, so it is
   * rejected rather than silently stored as an empty reply.
   */
  @ApiProperty({ minLength: 1, maxLength: REVIEW_TEXT_MAX_LENGTH })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(REVIEW_TEXT_MAX_LENGTH)
  reply!: string;
}
