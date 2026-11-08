import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateBy,
  ValidateNested,
  buildMessage,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

/** The longest problem matching reads; the frontend's field holds the same. */
export const MATCHING_PROBLEM_MAX_LENGTH = 1000;
/** The most turns one chat request carries, the person's and the assistant's together. */
export const MATCHING_CHAT_MAX_MESSAGES = 20;
export const MATCHING_CHAT_ROLES = ['user', 'assistant'] as const;
export type MatchingChatRole = (typeof MATCHING_CHAT_ROLES)[number];

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

  /** The services that fit, best first, at most four. */
  @ApiProperty({ type: [MatchingMatchDto] }) matches!: MatchingMatchDto[];
}

/** A conversation is answered after the person speaks, so its last turn is theirs. */
function EndsWithUserTurn(): PropertyDecorator {
  return ValidateBy({
    name: 'endsWithUserTurn',
    validator: {
      validate: (value: unknown) =>
        Array.isArray(value) &&
        (value.at(-1) as { role?: unknown } | undefined)?.role === 'user',
      defaultMessage: buildMessage(
        (each) => `${each}$property must end with a message whose role is user`,
      ),
    },
  });
}

export class MatchingChatMessageDto {
  /** `user` is the person; `assistant` is an earlier `reply` from this route. */
  @ApiProperty({ enum: MATCHING_CHAT_ROLES })
  @IsIn(MATCHING_CHAT_ROLES)
  role!: MatchingChatRole;

  @ApiProperty({
    minLength: 1,
    maxLength: MATCHING_PROBLEM_MAX_LENGTH,
    example: 'อยากหัดร้องเพลง เริ่มจากศูนย์เลย',
  })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(MATCHING_PROBLEM_MAX_LENGTH)
  content!: string;
}

export class MatchingChatRequestDto {
  /** The whole conversation so far, oldest first, ending with the person's newest message. */
  @ApiProperty({
    type: () => [MatchingChatMessageDto],
    minItems: 1,
    maxItems: MATCHING_CHAT_MAX_MESSAGES,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MATCHING_CHAT_MAX_MESSAGES)
  @ValidateNested({ each: true })
  @Type(() => MatchingChatMessageDto)
  @EndsWithUserTurn()
  messages!: MatchingChatMessageDto[];
}

export class MatchingChatSearchDto {
  /** A short headline for the results, in the person's language; empty in keyword mode. */
  @ApiProperty({ maxLength: 60, example: 'ครูสอนร้องเพลงสำหรับมือใหม่' })
  title!: string;

  /** Up to four short topic labels; empty in keyword mode. */
  @ApiProperty({ type: [String], maxItems: 4 }) topics!: string[];

  /**
   * The services that fit, best first, at most four. May be empty in `ai` mode
   * when Claude found nothing that fits; `reply` then says so.
   */
  @ApiProperty({ type: [MatchingMatchDto], maxItems: 8 })
  matches!: MatchingMatchDto[];
}

export class MatchingChatResponseDto {
  /** `ai` when Claude read the conversation; `keyword` when its words were matched instead. */
  @ApiProperty({ enum: ['ai', 'keyword'] }) mode!: 'ai' | 'keyword';

  /**
   * What the assistant says next, in the person's language: one or two short
   * sentences, or one clarifying question. Empty in keyword mode, where the
   * screen writes its own words.
   */
  @ApiProperty() reply!: string;

  /**
   * The results to show. `null` when the assistant asks a question instead of
   * searching, or in keyword mode when no service's words matched.
   */
  @ApiProperty({ type: () => MatchingChatSearchDto, nullable: true })
  search!: MatchingChatSearchDto | null;

  /** Up to three short replies the person could tap to refine; empty in keyword mode. */
  @ApiProperty({ type: [String], maxItems: 3 }) suggestions!: string[];
}
