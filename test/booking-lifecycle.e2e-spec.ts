import { eq } from 'drizzle-orm';
import type request from 'supertest';
import {
  serviceAppointments,
  services,
  user,
  screeningRequests,
} from '@/database/schema';
import { BookingsService } from '@/modules/bookings/bookings.service';
import { approveAsAdvisor, signUpUser } from './support/accounts';
import {
  createBookingFixtureIds,
  seedAdvisorService,
} from './support/booking-fixtures';
import { bookingE2eHarness } from './support/booking-e2e-harness';
import { data, object, stringField } from './support/response';

/**
 * AP-009 and AP-013 through the real HTTP stack and a real database. The unit specs mock
 * the repository, so the transaction in rescheduleWithSchedulingLock, the conditional
 * transition updates, and the cancellation check constraint are only proven here.
 */
async function book(
  agent: request.Agent,
  serviceId: string,
  startTime: string,
) {
  const response = await agent
    .post('/api/v1/bookings')
    .send({ serviceId, startTime })
    .expect(201);
  return data(response.body);
}

describe('booking lifecycle (e2e)', () => {
  let bookings: BookingsService;
  const ids = createBookingFixtureIds();
  const e2e = bookingE2eHarness(ids, ({ app }) => {
    bookings = app.get(BookingsService);
  });
  const signUp = () => signUpUser(e2e().app, 'Lifecycle', ids.userIds);

  /** A 09:00-12:00 window one week out gives several 60-minute slots to move between. */
  async function seedService() {
    const seeded = await seedAdvisorService(e2e(), ids, {
      label: 'Lifecycle',
    });
    return {
      ...seeded,
      first: seeded.slotAt('09:00'),
      second: seeded.slotAt('10:00'),
    };
  }

  async function readState(bookingId: string) {
    const [row] = await e2e()
      .db.select()
      .from(serviceAppointments)
      .where(eq(serviceAppointments.id, bookingId));
    return row;
  }

  it('reads advisor-owned session details without exposing another participant or advisor booking', async () => {
    const { advisor, serviceId, first } = await seedService();
    const advisee = await signUp();
    const bookingId = stringField(
      await book(advisee.agent, serviceId, first),
      'id',
    );
    const detail = await advisor.agent
      .get(`/api/v1/advisors/me/bookings/${bookingId}`)
      .expect(200);
    expect(data(detail.body)).toMatchObject({
      id: bookingId,
      adviseeId: advisee.userId,
      latestScreeningRequestId: null,
    });
    expect(data(detail.body)).toHaveProperty('adviseeName');
    expect(data(detail.body)).not.toHaveProperty('email');
    await advisee.agent
      .get(`/api/v1/advisors/me/bookings/${bookingId}`)
      .expect(403);
    const stranger = await signUp();
    await approveAsAdvisor(e2e().db, stranger, { headline: 'Other advisor' });
    await stranger.agent
      .get(`/api/v1/advisors/me/bookings/${bookingId}`)
      .expect(404);
    await advisor.agent
      .get('/api/v1/advisors/me/bookings/not-a-uuid')
      .expect(400);
    const [latest] = await e2e()
      .db.insert(screeningRequests)
      .values({ serviceId, adviseeId: advisee.userId, status: 'DECLINED' })
      .returning();
    try {
      const current = await advisor.agent
        .get(`/api/v1/advisors/me/bookings/${bookingId}`)
        .expect(200);
      expect(data(current.body).latestScreeningRequestId).toBe(latest.id);
    } finally {
      await e2e()
        .db.delete(screeningRequests)
        .where(eq(screeningRequests.id, latest.id));
    }
  });

  it('paginates advisor bookings with numeric defaults and rejects invalid page parameters', async () => {
    const { advisor, serviceId, first, second } = await seedService();
    const advisee = await signUp();
    await book(advisee.agent, serviceId, first);
    await book(advisee.agent, serviceId, second);
    const one = await advisor.agent
      .get('/api/v1/advisors/me/bookings?limit=1&page=1')
      .expect(200);
    const two = await advisor.agent
      .get('/api/v1/advisors/me/bookings?limit=1&page=2')
      .expect(200);
    expect(data(one.body)).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(data(two.body)).toMatchObject({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(data(one.body).items).not.toEqual(data(two.body).items);
    const defaults = await advisor.agent
      .get('/api/v1/advisors/me/bookings')
      .expect(200);
    expect(data(defaults.body)).toMatchObject({ page: 1, limit: 20, total: 2 });
    for (const query of [
      'limit=101',
      'limit=0',
      'limit=nope',
      'page=0',
      'page=-1',
    ]) {
      await advisor.agent
        .get(`/api/v1/advisors/me/bookings?${query}`)
        .expect(400);
    }
  });

  describe('reschedule', () => {
    it('cancels the original and claims the new time in one transaction', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      const response = await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(200);
      const replacement = data(response.body);

      expect(replacement.id).not.toBe(original.id);
      expect(replacement).toMatchObject({
        state: 'PENDING_PAYMENT',
        startTime: new Date(second).toISOString(),
      });

      const cancelled = await readState(stringField(original, 'id'));
      expect(cancelled.state).toBe('CANCELLED');
      // The cancellation check constraint requires both columns or neither.
      expect(cancelled.cancelledAt).not.toBeNull();
      expect(cancelled.cancelledByUserId).toBe(advisee.userId);
    });

    it('carries a paid booking across rather than asking the Advisee to pay twice', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);
      await bookings.confirmPayment(stringField(original, 'id'));

      const response = await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(200);

      expect(data(response.body).state).toBe('BOOKED');
    });

    it('frees the original time for another Advisee', async () => {
      const { serviceId, bookingDate, first, second } = await seedService();
      const advisee = await signUp();
      const other = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(200);

      const slots = await other.agent
        .get(`/api/v1/services/${serviceId}/slots`)
        .query({ from: bookingDate, to: bookingDate })
        .expect(200);
      expect(object(slots.body).data).toContainEqual(
        expect.objectContaining({ startTime: new Date(first).toISOString() }),
      );

      await other.agent
        .post('/api/v1/bookings')
        .send({ serviceId, startTime: first })
        .expect(201);
    });

    it('leaves the original booked when the new time is not a derived slot', async () => {
      const { serviceId, first } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: '2026-01-01T00:00:00.000Z' })
        .expect(400);

      const unchanged = await readState(stringField(original, 'id'));
      expect(unchanged.state).toBe('PENDING_PAYMENT');
      expect(unchanged.cancelledAt).toBeNull();
    });

    it('refuses to reschedule a terminal booking', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);
      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/cancel`)
        .expect(200);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(409);
    });

    it('hides another Advisee booking from reschedule', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const stranger = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      await stranger.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(404);
    });
  });

  describe('advisor list', () => {
    it('names the Advisee and the service on each booking', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const [person] = await e2e()
        .db.select({ displayName: user.displayName })
        .from(user)
        .where(eq(user.id, advisee.userId));
      const [offered] = await e2e()
        .db.select({ name: services.name })
        .from(services)
        .where(eq(services.id, serviceId));

      const response = await advisor.agent
        .get('/api/v1/advisors/me/bookings')
        .expect(200);
      const items = object(data(response.body)).items as unknown[];
      const listed = items
        .map((item) => object(item))
        .find((item) => item.id === stringField(booking, 'id'));

      expect(listed).toMatchObject({
        adviseeName: person.displayName,
        serviceName: offered.name,
      });
    });
  });

  describe('advisor transitions', () => {
    it('runs a booking through to COMPLETED', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');
      await bookings.confirmPayment(bookingId);

      const started = await advisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/start`)
        .expect(200);
      expect(data(started.body).state).toBe('IN_PROGRESS');

      const completed = await advisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/complete`)
        .expect(200);
      expect(data(completed.body).state).toBe('COMPLETED');
    });

    it('refuses to start a booking that has not been paid for', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);

      await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/start`,
        )
        .expect(409);
    });

    it('refuses to complete a booking that never started', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      await bookings.confirmPayment(stringField(booking, 'id'));

      await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/complete`,
        )
        .expect(409);
    });

    it('refuses a no-show before the appointment starts', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      await bookings.confirmPayment(stringField(booking, 'id'));

      await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/no-show`,
        )
        .expect(400);
    });

    it('hides another Advisor booking from every transition', async () => {
      const { serviceId, first } = await seedService();
      const otherAdvisor = await signUp();
      await approveAsAdvisor(e2e().db, otherAdvisor, {
        headline: 'Other',
        bio: 'Other advisor',
      });
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');

      await otherAdvisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/start`)
        .expect(404);
      await otherAdvisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/cancel`)
        .expect(404);
    });

    it('records the Advisor as the cancelling party', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);

      const cancelled = await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/cancel`,
        )
        .expect(200);
      expect(data(cancelled.body)).toMatchObject({
        state: 'CANCELLED',
        cancelledByUserId: advisor.userId,
      });
    });
  });

  describe('terminal states and visibility', () => {
    it('refuses a second cancellation', async () => {
      const { serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(booking, 'id')}/cancel`)
        .expect(200);
      await advisee.agent
        .post(`/api/v1/bookings/${stringField(booking, 'id')}/cancel`)
        .expect(409);
    });

    it('is idempotent when a payment webhook is redelivered', async () => {
      const { serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');

      const once = await bookings.confirmPayment(bookingId);
      const twice = await bookings.confirmPayment(bookingId);

      expect(once.state).toBe('BOOKED');
      expect(twice.state).toBe('BOOKED');
    });

    it('shows one booking to both parties and nobody else', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const stranger = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');

      const adviseeDetail = await advisee.agent
        .get(`/api/v1/bookings/${bookingId}`)
        .expect(200);
      const advisorDetail = await advisor.agent
        .get(`/api/v1/bookings/${bookingId}`)
        .expect(200);
      expect(data(adviseeDetail.body).state).toBe('PENDING_PAYMENT');
      expect(data(advisorDetail.body).state).toBe('PENDING_PAYMENT');

      const adviseeList = await advisee.agent
        .get('/api/v1/bookings/me')
        .expect(200);
      const advisorList = await advisor.agent
        .get('/api/v1/advisors/me/bookings')
        .expect(200);
      expect(data(adviseeList.body).items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: bookingId })]),
      );
      expect(data(advisorList.body).items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: bookingId })]),
      );

      await advisee.agent
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .expect(200);
      const cancelled = await Promise.all([
        advisee.agent.get(`/api/v1/bookings/${bookingId}`).expect(200),
        advisor.agent.get(`/api/v1/bookings/${bookingId}`).expect(200),
      ]);
      expect(data(cancelled[0].body).state).toBe('CANCELLED');
      expect(data(cancelled[1].body).state).toBe('CANCELLED');
      await stranger.agent.get(`/api/v1/bookings/${bookingId}`).expect(404);
    });
  });
});
