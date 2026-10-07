import { ApiProperty } from '@nestjs/swagger';
import { ScreeningQuestionResponseDto } from './screening-question-response.dto';
import { ScreeningRequestResponseDto } from './screening-request-response.dto';

/** Everything the Advisee's screening screens need for one Service, in one read. */
export class ServiceScreeningResponseDto {
  @ApiProperty({ format: 'uuid' }) serviceId: string;
  @ApiProperty() screeningRequired: boolean;
  @ApiProperty({ type: () => [ScreeningQuestionResponseDto] })
  questions: ScreeningQuestionResponseDto[];
  @ApiProperty({ type: () => ScreeningRequestResponseDto, nullable: true })
  request: ScreeningRequestResponseDto | null;

  constructor(values: {
    serviceId: string;
    screeningRequired: boolean;
    questions: ScreeningQuestionResponseDto[];
    request: ScreeningRequestResponseDto | null;
  }) {
    this.serviceId = values.serviceId;
    this.screeningRequired = values.screeningRequired;
    this.questions = values.questions;
    this.request = values.request;
  }
}
