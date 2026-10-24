import { ApiProperty } from '@nestjs/swagger';
import type { AdvisorAppointment } from '../bookings.repository';
import { BookingResponseDto } from './booking-response.dto';

/**
 * A booking in `GET /advisors/me/bookings`: the shared booking fields plus the
 * two the Advisor's desk names, which the Advisor has no other route to read.
 */
export class AdvisorBookingResponseDto extends BookingResponseDto {
  /** The Advisee's public display name, never their email or legal name. */
  @ApiProperty() adviseeName: string;
  @ApiProperty() serviceName: string;

  constructor(appointment: AdvisorAppointment) {
    super(appointment);
    this.adviseeName = appointment.adviseeName;
    this.serviceName = appointment.serviceName;
  }
}
