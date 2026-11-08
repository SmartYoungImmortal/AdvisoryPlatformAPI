import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** The longest problem matching reads; the frontend's field holds the same. */
export const MATCHING_PROBLEM_MAX_LENGTH = 1000;

export class MatchingRequestDto {
  @ApiProperty({
    maxLength: MATCHING_PROBLEM_MAX_LENGTH,
    example:
      'เพิ่งเริ่มรับงานฟรีแลนซ์ ไม่แน่ใจว่าต้องยื่นภาษีแบบไหน และหักค่าใช้จ่ายได้เท่าไร',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MATCHING_PROBLEM_MAX_LENGTH)
  problem!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Integer satang' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxPriceSatang?: number;
}

export class MatchingMatchDto {
  @ApiProperty({ format: 'uuid' }) serviceId!: string;

  /** Why this service fits, in the problem's language. `null` when the words matched instead. */
  @ApiPropertyOptional({ nullable: true, type: String })
  reason!: string | null;

  /** The problem's words found in the service's own words; empty when Claude chose it. */
  @ApiProperty({ type: [String] }) matched!: string[];
}

export class MatchingStatusDto {
  /** True when `ANTHROPIC_API_KEY` is set and a model reads the problems. */
  @ApiProperty() ai!: boolean;
}

export class MatchingResponseDto {
  /** `ai` when Claude read the problem; `keyword` when its words were matched instead. */
  @ApiProperty({ enum: ['ai', 'keyword'] }) mode!: 'ai' | 'keyword';

  /** One sentence restating what the person needs; `null` in keyword mode. */
  @ApiPropertyOptional({ nullable: true, type: String })
  understanding!: string | null;

  /** Up to four short topic labels the problem touches; empty in keyword mode. */
  @ApiProperty({ type: [String] }) topics!: string[];

  /** The services that fit, best first, at most eight. */
  @ApiProperty({ type: [MatchingMatchDto] }) matches!: MatchingMatchDto[];
}
