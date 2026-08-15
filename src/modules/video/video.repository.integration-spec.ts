import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import * as schema from '@/database/schema';
import {
  advisorProfiles,
  serviceAppointments,
  serviceCategories,
  services,
  serviceTimeslots,
  user,
} from '@/database/schema';
import { VideoRepository } from './video.repository';

describe('VideoRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: VideoRepository;
  const advisorId = crypto.randomUUID();
  const adviseeId = crypto.randomUUID();
  const outsiderId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();
  const timeslotId = crypto.randomUUID();
  const appointmentId = crypto.randomUUID();

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    repository = new VideoRepository(db);

    await db.insert(user).values(
      [advisorId, adviseeId, outsiderId].map((id) => ({
        id,
        email: `${id}@example.test`,
        displayName: 'Video user',
        fullName: 'Video User',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db.insert(advisorProfiles).values({
      userId: advisorId,
      headline: 'Video advisor',
    });
    await db.insert(serviceCategories).values({
      id: categoryId,
      name: `Video ${categoryId}`,
    });
    await db.insert(services).values({
      id: serviceId,
      advisorId,
      categoryId,
      name: 'Video consultation',
      priceSatang: 100_00,
      durationMinutes: 60,
    });
    await db.insert(serviceTimeslots).values({
      id: timeslotId,
      serviceId,
      startTime: new Date('2026-08-15T10:00:00Z'),
      endTime: new Date('2026-08-15T11:00:00Z'),
    });
    await db.insert(serviceAppointments).values({
      id: appointmentId,
      timeslotId,
      adviseeId,
      state: 'BOOKED',
    });
  });

  afterAll(async () => {
    await db
      .delete(serviceAppointments)
      .where(eq(serviceAppointments.id, appointmentId));
    await db
      .delete(serviceTimeslots)
      .where(eq(serviceTimeslots.id, timeslotId));
    await db.delete(services).where(eq(services.id, serviceId));
    await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId));
    await db
      .delete(advisorProfiles)
      .where(eq(advisorProfiles.userId, advisorId));
    await db
      .delete(user)
      .where(inArray(user.id, [advisorId, adviseeId, outsiderId]));
    await pool.end();
  });

  it('finds the appointment for either participant but not an outsider', async () => {
    await expect(
      repository.findForParticipant(appointmentId, adviseeId),
    ).resolves.toMatchObject({ id: appointmentId, state: 'BOOKED' });
    await expect(
      repository.findForParticipant(appointmentId, advisorId),
    ).resolves.toMatchObject({ id: appointmentId, state: 'BOOKED' });
    await expect(
      repository.findForParticipant(appointmentId, outsiderId),
    ).resolves.toBeUndefined();
  });

  it('keeps one room name under concurrent first access', async () => {
    const [first, second] = await Promise.all([
      repository.assignRoomNameIfMissing(appointmentId, 'appointment-first'),
      repository.assignRoomNameIfMissing(appointmentId, 'appointment-second'),
    ]);
    const [stored] = await db
      .select({ roomName: serviceAppointments.jitsiRoomName })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.id, appointmentId));

    expect(first).toBe(stored?.roomName);
    expect(second).toBe(stored?.roomName);
    expect(stored?.roomName).toMatch(/^appointment-(first|second)$/);
  });
});
