import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import {
  advisorIdentity,
  advisorProfiles,
  chatMembers,
  chatRooms,
  serviceAppointments,
  serviceCategories,
  services,
  trialRequests,
  user,
} from '@/database/schema';
import { AvailabilityRepository } from '@/modules/availability/availability.repository';
import { openServiceChatRoom } from '@/modules/chat/booking-chat-room';
import { TrialsRepository } from './trials.repository';

/**
 * These tests use a real Postgres database because the repository depends on a transaction that
 * opens a chat room, the per-Advisor lock, and a unique index.
 */
describe('TrialsRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: TrialsRepository;
  let availability: AvailabilityRepository;
  let setupComplete = false;

  const advisorId = crypto.randomUUID();
  const adviseeId = crypto.randomUUID();
  const bookedAdviseeId = crypto.randomUUID();
  const outsiderId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();
  const draftServiceId = crypto.randomUUID();
  const userIds = [advisorId, adviseeId, bookedAdviseeId, outsiderId];
  const serviceIds = [serviceId, draftServiceId];

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new TrialsRepository(db);
    availability = new AvailabilityRepository(db);

    await db.insert(user).values(
      userIds.map((id) => ({
        id,
        email: `${id}@trials.example.test`,
        displayName: id === adviseeId ? 'ณัฐพงษ์ ด.' : 'Trial test',
        fullName: 'Trial Test',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db
      .insert(advisorProfiles)
      .values({ userId: advisorId, headline: 'Trial test advisor' });
    await db
      .insert(advisorIdentity)
      .values({ advisorId, verificationStatus: 'VERIFIED' });
    await db
      .insert(serviceCategories)
      .values({ id: categoryId, name: `Trial test ${categoryId}` });
    await db.insert(services).values([
      {
        id: serviceId,
        advisorId,
        categoryId,
        name: 'วางแผนภาษี',
        priceSatang: 60000,
        durationMinutes: 60,
        isPublished: true,
        trialEnabled: true,
        trialDurationMinutes: 15,
      },
      {
        id: draftServiceId,
        advisorId,
        categoryId,
        name: 'Draft',
        priceSatang: 60000,
        durationMinutes: 60,
        isPublished: false,
      },
    ]);
    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await pool?.end();
      return;
    }
    const roomIds = (
      await db
        .select({ id: chatMembers.chatRoomId })
        .from(chatMembers)
        .where(eq(chatMembers.memberUserId, advisorId))
    ).map((row) => row.id);
    await db
      .delete(trialRequests)
      .where(inArray(trialRequests.serviceId, serviceIds));
    await db
      .delete(serviceAppointments)
      .where(inArray(serviceAppointments.serviceId, serviceIds));
    if (roomIds.length > 0) {
      await db
        .delete(chatMembers)
        .where(inArray(chatMembers.chatRoomId, roomIds));
      await db.delete(chatRooms).where(inArray(chatRooms.id, roomIds));
    }
    await db.delete(services).where(inArray(services.id, serviceIds));
    await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId));
    await db
      .delete(advisorIdentity)
      .where(eq(advisorIdentity.advisorId, advisorId));
    await db
      .delete(advisorProfiles)
      .where(eq(advisorProfiles.userId, advisorId));
    await db.delete(user).where(inArray(user.id, userIds));
    await pool.end();
  });

  it('finds a published service of a verified advisor, with its trial', async () => {
    await expect(repository.findPublishedService(serviceId)).resolves.toEqual({
      id: serviceId,
      name: 'วางแผนภาษี',
      advisorId,
      trialEnabled: true,
      trialDurationMinutes: 15,
    });
    await expect(
      repository.findPublishedService(draftServiceId),
    ).resolves.toBeUndefined();
    await expect(repository.findServiceNames(serviceId)).resolves.toEqual({
      th: 'วางแผนภาษี',
      en: 'วางแผนภาษี',
    });
    await expect(repository.findDisplayName(adviseeId)).resolves.toBe(
      'ณัฐพงษ์ ด.',
    );
  });

  it('opens a room for a first ask, allows one ask, and decides it once', async () => {
    const request = await repository.createWithRoom({
      serviceId,
      adviseeId,
      advisorId,
    });
    expect(request).toEqual(
      expect.objectContaining({ status: 'PENDING', adviseeId }),
    );

    // The room is new, with the two of them in it.
    const members = await db
      .select({ memberUserId: chatMembers.memberUserId })
      .from(chatMembers)
      .where(eq(chatMembers.chatRoomId, request.chatRoomId));
    expect(members.map((row) => row.memberUserId)).toHaveLength(2);
    expect(members.map((row) => row.memberUserId)).toEqual(
      expect.arrayContaining([adviseeId, advisorId]),
    );
    await expect(
      repository.isRoomMember(request.chatRoomId, adviseeId),
    ).resolves.toBe(true);
    await expect(
      repository.isRoomMember(request.chatRoomId, outsiderId),
    ).resolves.toBe(false);

    // A second ask for the same service fails on the unique index.
    await expect(
      repository.createWithRoom({ serviceId, adviseeId, advisorId }),
    ).rejects.toBeDefined();

    await expect(
      repository.findForAdvisee(serviceId, adviseeId),
    ).resolves.toEqual(
      expect.objectContaining({
        id: request.id,
        serviceName: 'วางแผนภาษี',
        advisorId,
        trialDurationMinutes: 15,
      }),
    );
    await expect(repository.findForRoom(request.chatRoomId)).resolves.toEqual([
      expect.objectContaining({ id: request.id }),
    ]);
    await expect(
      repository.findOneForAdvisor(request.id, advisorId),
    ).resolves.toEqual(expect.objectContaining({ id: request.id }));
    await expect(
      repository.findOneForAdvisor(request.id, outsiderId),
    ).resolves.toBeUndefined();

    const decidedAt = new Date();
    await expect(
      repository.decidePending(request.id, {
        status: 'GRANTED',
        decisionReason: null,
        decidedAt,
      }),
    ).resolves.toEqual(expect.objectContaining({ status: 'GRANTED' }));
    // Only the first decision is saved.
    await expect(
      repository.decidePending(request.id, {
        status: 'DECLINED',
        decisionReason: 'Too late',
        decidedAt,
      }),
    ).resolves.toBeUndefined();

    // A later booking of the same service joins the room the ask opened.
    await expect(
      db.transaction((tx) =>
        openServiceChatRoom(tx, {
          serviceId,
          adviseeId,
          advisorId,
          createdAt: new Date(),
        }),
      ),
    ).resolves.toBe(request.chatRoomId);
  });

  it('puts the ask in the room an earlier booking opened', async () => {
    const bookedRoomId = await db.transaction((tx) =>
      openServiceChatRoom(tx, {
        serviceId,
        adviseeId: bookedAdviseeId,
        advisorId,
        createdAt: new Date(),
      }),
    );
    await db.insert(serviceAppointments).values({
      serviceId,
      advisorId,
      adviseeId: bookedAdviseeId,
      startTime: new Date('2026-12-01T03:00:00Z'),
      endTime: new Date('2026-12-01T04:00:00Z'),
      unavailableUntil: new Date('2026-12-01T04:00:00Z'),
      chatRoomId: bookedRoomId,
      state: 'CANCELLED',
      blocksAvailability: false,
      cancelledAt: new Date(),
      cancelledByUserId: bookedAdviseeId,
    });

    const request = await repository.createWithRoom({
      serviceId,
      adviseeId: bookedAdviseeId,
      advisorId,
    });

    expect(request.chatRoomId).toBe(bookedRoomId);
  });

  it('counts a granted trial as used while its booking stands', async () => {
    // The advisee from the first test was granted; nothing is booked yet.
    await expect(
      availability.hasUsableTrial(serviceId, adviseeId),
    ).resolves.toBe(true);
    await expect(
      availability.hasUsableTrial(serviceId, outsiderId),
    ).resolves.toBe(false);
    const request = await repository.findForAdvisee(serviceId, adviseeId);
    expect(request?.trialBookingId).toBeNull();

    const [booked] = await db
      .insert(serviceAppointments)
      .values({
        serviceId,
        advisorId,
        adviseeId,
        type: 'TRIAL',
        state: 'BOOKED',
        startTime: new Date('2026-12-02T03:00:00Z'),
        endTime: new Date('2026-12-02T03:15:00Z'),
        unavailableUntil: new Date('2026-12-02T03:15:00Z'),
        chatRoomId: request?.chatRoomId,
      })
      .returning();

    await expect(
      availability.hasUsableTrial(serviceId, adviseeId),
    ).resolves.toBe(false);
    await expect(
      repository.findForAdvisee(serviceId, adviseeId),
    ).resolves.toEqual(expect.objectContaining({ trialBookingId: booked.id }));

    // A cancelled trial gives the grant back.
    await db
      .update(serviceAppointments)
      .set({
        state: 'CANCELLED',
        blocksAvailability: false,
        cancelledAt: new Date(),
        cancelledByUserId: adviseeId,
      })
      .where(eq(serviceAppointments.id, booked.id));

    await expect(
      availability.hasUsableTrial(serviceId, adviseeId),
    ).resolves.toBe(true);
    await expect(
      repository.findForAdvisee(serviceId, adviseeId),
    ).resolves.toEqual(expect.objectContaining({ trialBookingId: null }));
  });
});
