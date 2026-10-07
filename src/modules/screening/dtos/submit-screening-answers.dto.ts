import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import {
  SCREENING_ANSWER_MAX_LENGTH,
  SCREENING_MAX_QUESTIONS,
} from '@/modules/screening/screening.constants';

export class ScreeningAnswerInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId!: string;

  @ApiProperty({ minLength: 1, maxLength: SCREENING_ANSWER_MAX_LENGTH })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(SCREENING_ANSWER_MAX_LENGTH)
  answer!: string;
}

/** Optional questions are answered by leaving them out; every required one must be present. */
export class SubmitScreeningAnswersDto {
  @ApiProperty({
    type: () => [ScreeningAnswerInputDto],
    maxItems: SCREENING_MAX_QUESTIONS,
  })
  @IsArray()
  @ArrayMaxSize(SCREENING_MAX_QUESTIONS)
  @ValidateNested({ each: true })
  @Type(() => ScreeningAnswerInputDto)
  answers!: ScreeningAnswerInputDto[];
}
