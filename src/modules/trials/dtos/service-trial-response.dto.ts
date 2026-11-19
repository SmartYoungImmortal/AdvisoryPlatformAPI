import { ApiProperty } from '@nestjs/swagger';
import { TrialRequestResponseDto } from './trial-request-response.dto';

/** A Service's free trial as one Advisee sees it: whether it is offered, and their request. */
export class ServiceTrialResponseDto {
  @ApiProperty({ format: 'uuid' }) serviceId: string;
  @ApiProperty() trialEnabled: boolean;
  @ApiProperty({ nullable: true, type: Number })
  trialDurationMinutes: number | null;
  @ApiProperty({ nullable: true, type: TrialRequestResponseDto })
  request: TrialRequestResponseDto | null;

  constructor(values: {
    serviceId: string;
    trialEnabled: boolean;
    trialDurationMinutes: number | null;
    request: TrialRequestResponseDto | null;
  }) {
    this.serviceId = values.serviceId;
    this.trialEnabled = values.trialEnabled;
    this.trialDurationMinutes = values.trialDurationMinutes;
    this.request = values.request;
  }
}
