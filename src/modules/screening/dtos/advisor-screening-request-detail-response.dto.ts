import { ApiProperty } from '@nestjs/swagger';
import type {
  AdvisorScreeningRequestRow,
  ScreeningAnswerRow,
} from '@/modules/screening/screening.types';
import { AdvisorScreeningRequestResponseDto } from './advisor-screening-request-response.dto';

export class ScreeningAnswerResponseDto {
  @ApiProperty({ format: 'uuid' }) questionId: string;
  /** The question text at the time it was answered. */
  @ApiProperty() questionText: string;
  @ApiProperty() answer: string;

  constructor(row: ScreeningAnswerRow) {
    this.questionId = row.questionId;
    this.questionText = row.questionText;
    this.answer = row.answer;
  }
}

/** One request with all its answers, in question order (Figma "Advisor - Review answers"). */
export class AdvisorScreeningRequestDetailResponseDto extends AdvisorScreeningRequestResponseDto {
  @ApiProperty({ type: () => [ScreeningAnswerResponseDto] })
  answers: ScreeningAnswerResponseDto[];

  constructor(row: AdvisorScreeningRequestRow, answers: ScreeningAnswerRow[]) {
    super(row);
    this.answers = answers.map(
      (answer) => new ScreeningAnswerResponseDto(answer),
    );
  }
}
