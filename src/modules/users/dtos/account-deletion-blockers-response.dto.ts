import { ApiProperty } from '@nestjs/swagger';
import { appointmentStateEnum } from '@/database/schema';

export class AccountDeletionAppointmentBlockerDto {
  @ApiProperty()
  appointmentId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startTime: Date;

  @ApiProperty({ enum: appointmentStateEnum.enumValues })
  state: (typeof appointmentStateEnum.enumValues)[number];

  constructor(blocker: AccountDeletionAppointmentBlockerDto) {
    this.appointmentId = blocker.appointmentId;
    this.startTime = blocker.startTime;
    this.state = blocker.state;
  }
}

export class AccountDeletionBlockersResponseDto {
  @ApiProperty()
  hasUnsettledEarnings: boolean;

  @ApiProperty({ type: [AccountDeletionAppointmentBlockerDto] })
  upcomingAppointments: AccountDeletionAppointmentBlockerDto[];

  constructor(
    blockers: AccountDeletionAppointmentBlockerDto[],
    hasUnsettledEarnings: boolean,
  ) {
    this.hasUnsettledEarnings = hasUnsettledEarnings;
    this.upcomingAppointments = blockers.map(
      (blocker) => new AccountDeletionAppointmentBlockerDto(blocker),
    );
  }
}
