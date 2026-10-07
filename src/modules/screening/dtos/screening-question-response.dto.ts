import { ApiProperty } from '@nestjs/swagger';
import type { ScreeningQuestion } from '@/modules/screening/screening.types';

export class ScreeningQuestionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() question: string;
  @ApiProperty() isRequired: boolean;
  @ApiProperty() displayOrder: number;

  constructor(question: ScreeningQuestion) {
    this.id = question.id;
    this.question = question.question;
    this.isRequired = question.isRequired;
    this.displayOrder = question.displayOrder;
  }
}
