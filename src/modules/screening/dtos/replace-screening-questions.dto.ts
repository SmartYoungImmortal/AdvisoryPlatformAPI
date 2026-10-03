import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import {
  SCREENING_MAX_QUESTIONS,
  SCREENING_QUESTION_MAX_LENGTH,
} from '@/modules/screening/screening.constants';

export class ScreeningQuestionInputDto {
  @ApiProperty({ minLength: 1, maxLength: SCREENING_QUESTION_MAX_LENGTH })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(SCREENING_QUESTION_MAX_LENGTH)
  question!: string;

  /** Optional questions may be left unanswered by the Advisee. */
  @ApiProperty()
  @IsBoolean()
  isRequired!: boolean;
}

/**
 * The whole ordered list, replacing whatever was there. At least one question, because a
 * screened Service with none could never be booked (decision 2).
 */
export class ReplaceScreeningQuestionsDto {
  @ApiProperty({
    type: () => [ScreeningQuestionInputDto],
    minItems: 1,
    maxItems: SCREENING_MAX_QUESTIONS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SCREENING_MAX_QUESTIONS)
  @ValidateNested({ each: true })
  @Type(() => ScreeningQuestionInputDto)
  questions!: ScreeningQuestionInputDto[];
}
