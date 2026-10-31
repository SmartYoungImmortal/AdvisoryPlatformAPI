import request from 'supertest';
import { eq } from 'drizzle-orm';
import {
  refundCases,
  refundCaseEvidence,
  serviceAppointments,
  serviceAppointmentsOnInvoice,
  serviceInvoices,
} from '@/database/schema';
import { createE2eApp, type BootedE2eApp } from './support/e2e-app';
import {
  createBookingFixtureIds,
  deleteBookingFixtures,
  seedAdvisorService,
} from './support/booking-fixtures';
import { signUpUser } from './support/accounts';
import { data, object, stringField } from './support/response';

describe('own refund requests and private evidence (e2e)', () => {
  let context: BootedE2eApp;
  const ids = createBookingFixtureIds();
  let caseId: string | undefined;
  beforeAll(async () => {
    context = await createE2eApp();
  });
  afterAll(async () => {
    if (caseId) {
      await context.db
        .delete(refundCaseEvidence)
        .where(eq(refundCaseEvidence.refundCaseId, caseId));
      await context.db.delete(refundCases).where(eq(refundCases.id, caseId));
    }
    await deleteBookingFixtures(context.db, ids);
    await context.app.close();
  });

  it('persists a filtered request, protects private evidence, deduplicates retries and enforces upload limits', async () => {
    const { app, db, storage } = context;
    const fixture = await seedAdvisorService(context, ids, {
      label: 'Refund evidence',
    });
    const payer = await signUpUser(app, 'Refund payer', ids.userIds);
    const stranger = await signUpUser(app, 'Refund stranger', ids.userIds);
    const booked = await payer.agent
      .post('/api/v1/bookings')
      .send({
        serviceId: fixture.serviceId,
        startTime: fixture.slotAt('09:00'),
      })
      .expect(201);
    const bookingId = stringField(data(booked.body), 'id');
    await db
      .update(serviceAppointments)
      .set({ state: 'BOOKED' })
      .where(eq(serviceAppointments.id, bookingId));
    const [invoice] = await db
      .insert(serviceInvoices)
      .values({
        amountSatang: 150000,
        platformFeeSatang: 30000,
        status: 'HELD_IN_ESCROW',
      })
      .returning();
    await db.insert(serviceAppointmentsOnInvoice).values({
      serviceAppointmentId: bookingId,
      serviceInvoiceId: invoice.id,
    });
    const attempts = await Promise.all(
      [1, 2].map(() =>
        payer.agent.post('/api/v1/refunds').send({
          invoiceId: invoice.id,
          reason: 'The advisor did not attend',
        }),
      ),
    );
    expect(attempts.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    const opened = attempts.find((response) => response.status === 201);
    if (!opened) throw new Error('No refund request was created');
    caseId = stringField(data(opened.body), 'id');
    const base = `/api/v1/refunds/${caseId}`;
    const mine = await payer.agent
      .get(`/api/v1/refunds/me?invoiceId=${invoice.id}`)
      .expect(200);
    expect(data(mine.body)).toMatchObject({
      total: 1,
      items: [expect.objectContaining({ id: caseId, status: 'OPEN' })],
    });
    const other = await stranger.agent
      .get(`/api/v1/refunds/me?invoiceId=${invoice.id}`)
      .expect(200);
    expect(data(other.body)).toMatchObject({ total: 0, items: [] });
    await payer.agent.get('/api/v1/refunds/me?invoiceId=invalid').expect(400);
    await request(app.getHttpServer()).get(`${base}/evidence`).expect(401);
    await stranger.agent.get(`${base}/evidence`).expect(404);
    await payer.agent.post(`${base}/evidence`).expect(400);
    await payer.agent
      .post(`${base}/evidence`)
      .attach('file', Buffer.from('bad'), {
        filename: 'bad.html',
        contentType: 'text/html',
      })
      .expect(400);
    const bytes = Buffer.from('%PDF-1.7\nRefund evidence');
    await stranger.agent
      .post(`${base}/evidence`)
      .attach('file', bytes, {
        filename: 'case.pdf',
        contentType: 'application/pdf',
      })
      .expect(404);
    const first = await payer.agent
      .post(`${base}/evidence`)
      .attach('file', bytes, {
        filename: 'case.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    const key = stringField(data(first.body), 'objectKey');
    expect(storage.getObject(key)?.body).toEqual(bytes);
    await payer.agent
      .post(`${base}/evidence`)
      .attach('file', bytes, {
        filename: 'retry.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    expect(storage.objectCount()).toBe(1);
    const signed = await payer.agent
      .get(`${base}/evidence-url`)
      .query({ objectKey: key })
      .expect(200);
    expect(data(signed.body)).toMatchObject({
      expiresInSeconds: 300,
    });
    expect(stringField(data(signed.body), 'url')).toContain(
      'storage.example.test',
    );
    await stranger.agent
      .get(`${base}/evidence-url`)
      .query({ objectKey: key })
      .expect(404);
    await payer.agent
      .get(`${base}/evidence-url`)
      .query({ objectKey: 'another/case.pdf' })
      .expect(404);
    await payer.agent
      .get(`/api/v1/admin/refunds/${caseId}/evidence-url`)
      .query({ objectKey: key })
      .expect(403);
    await payer.agent
      .post(`${base}/evidence`)
      .attach('file', Buffer.alloc(50 * 1024 * 1024 + 1), {
        filename: 'oversize.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);
    await payer.agent
      .post(`${base}/evidence`)
      .attach('file', Buffer.alloc(50 * 1024 * 1024), {
        filename: 'maximum.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    await Promise.all(
      [1, 2, 3, 4].map(async (index) => {
        const response = await payer.agent
          .post(`${base}/evidence`)
          .attach('file', Buffer.from(`%PDF-1.7\n${index}`), {
            filename: `${index}.pdf`,
            contentType: 'application/pdf',
          });
        expect([201, 400]).toContain(response.status);
      }),
    );
    const files = await payer.agent.get(`${base}/evidence`).expect(200);
    expect(object(files.body).data).toHaveLength(5);
    expect(storage.objectCount()).toBe(5);
    await db
      .update(refundCases)
      .set({ status: 'APPROVED', resolvedAt: new Date() })
      .where(eq(refundCases.id, caseId));
    await payer.agent
      .post(`${base}/evidence`)
      .attach('file', Buffer.from('%PDF-new'), {
        filename: 'late.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    const result = await payer.agent
      .get(`/api/v1/refunds/me?invoiceId=${invoice.id}`)
      .expect(200);
    expect(data(result.body)).toMatchObject({
      items: [expect.objectContaining({ status: 'APPROVED' })],
    });
    expect(
      (
        await db
          .select()
          .from(serviceInvoices)
          .where(eq(serviceInvoices.id, invoice.id))
      )[0].status,
    ).toBe('HELD_IN_ESCROW');
  });
});
