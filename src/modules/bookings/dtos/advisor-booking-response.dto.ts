import { ApiProperty } from '@nestjs/swagger';
import type { AdvisorAppointment } from '../bookings.repository';
import { BookingResponseDto } from './booking-response.dto';

/** The two pictures a booking on the Advisor's desk is drawn with, as URLs a browser can fetch. */
export interface AdvisorBookingPictures {
  adviseeAvatarUrl: string | null;
  serviceImageUrl: string | null;
}

/**
 * A booking in `GET /advisors/me/bookings`: the shared booking fields plus the
 * ones the Advisor's desk draws it with, which the Advisor has no other route to
 * read: who booked (their public display name and avatar) and what (the
 * service's name and first photograph).
 */
export class AdvisorBookingResponseDto extends BookingResponseDto {
  /** The Advisee's public display name, never their email or legal name. */
  @ApiProperty() adviseeName: string;
  @ApiProperty() serviceName: string;
  /** The Advisee's avatar (presigned for an hour when stored), or null without one. */
  @ApiProperty({ type: String, nullable: true }) adviseeAvatarUrl:
    string | null;
  /** The service's first photograph (presigned for an hour when stored), or null without one. */
  @ApiProperty({ type: String, nullable: true }) serviceImageUrl: string | null;

  constructor(
    appointment: AdvisorAppointment,
    pictures: AdvisorBookingPictures = {
      adviseeAvatarUrl: null,
      serviceImageUrl: null,
    },
  ) {
    super(appointment);
    this.adviseeName = appointment.adviseeName;
    this.serviceName = appointment.serviceName;
    this.adviseeAvatarUrl = pictures.adviseeAvatarUrl;
    this.serviceImageUrl = pictures.serviceImageUrl;
  }
}
