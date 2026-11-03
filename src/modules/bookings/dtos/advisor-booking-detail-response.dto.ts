import { ApiProperty } from '@nestjs/swagger';
import type { AdvisorAppointmentDetail } from '@/modules/bookings/bookings.repository';
import {
  type AdvisorBookingPictures,
  AdvisorBookingResponseDto,
} from './advisor-booking-response.dto';

export class AdvisorBookingDetailResponseDto extends AdvisorBookingResponseDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  chatRoomId: string | null;
  /** The latest request for this service/advisee, not a historical booking snapshot. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  latestScreeningRequestId: string | null;

  constructor(
    appointment: AdvisorAppointmentDetail,
    pictures?: AdvisorBookingPictures,
  ) {
    super(appointment, pictures);
    this.chatRoomId = appointment.chatRoomId;
    this.latestScreeningRequestId = appointment.latestScreeningRequestId;
  }
}
