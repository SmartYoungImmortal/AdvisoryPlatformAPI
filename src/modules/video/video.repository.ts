import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, or } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  serviceAppointments,
  services,
  serviceTimeslots,
} from '@/database/schema';

export interface VideoAppointmentAccess {
  id: string;
  state: typeof serviceAppointments.$inferSelect.state;
  jitsiRoomName: string | null;
  startTime: Date;
  endTime: Date;
}

@Injectable()
export class VideoRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findForParticipant(
    appointmentId: string,
    userId: string,
  ): Promise<VideoAppointmentAccess | undefined> {
    const [appointment] = await this.db
      .select({
        id: serviceAppointments.id,
        state: serviceAppointments.state,
        jitsiRoomName: serviceAppointments.jitsiRoomName,
        startTime: serviceTimeslots.startTime,
        endTime: serviceTimeslots.endTime,
      })
      .from(serviceAppointments)
      .innerJoin(
        serviceTimeslots,
        eq(serviceTimeslots.id, serviceAppointments.timeslotId),
      )
      .innerJoin(services, eq(services.id, serviceTimeslots.serviceId))
      .where(
        and(
          eq(serviceAppointments.id, appointmentId),
          or(
            eq(serviceAppointments.adviseeId, userId),
            eq(services.advisorId, userId),
          ),
        ),
      )
      .limit(1);

    return appointment;
  }

  async assignRoomNameIfMissing(
    appointmentId: string,
    roomName: string,
  ): Promise<string | undefined> {
    const [updated] = await this.db
      .update(serviceAppointments)
      .set({ jitsiRoomName: roomName })
      .where(
        and(
          eq(serviceAppointments.id, appointmentId),
          isNull(serviceAppointments.jitsiRoomName),
        ),
      )
      .returning({ jitsiRoomName: serviceAppointments.jitsiRoomName });

    if (updated?.jitsiRoomName) {
      return updated.jitsiRoomName;
    }

    const [existing] = await this.db
      .select({ jitsiRoomName: serviceAppointments.jitsiRoomName })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.id, appointmentId))
      .limit(1);

    return existing?.jitsiRoomName ?? undefined;
  }
}
