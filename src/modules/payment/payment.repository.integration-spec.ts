import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import {
  advisorProfiles,
  availabilityProfiles,
  serviceAppointments,
  serviceAppointmentsOnInvoice,
  serviceCategories,
  serviceInvoices,
  services,
  user,
} from '@/database/schema';
import { PaymentServiceInvoicesRepository } from './payment.repository';

/** An hour on the given day of November 2026, as the receipt's `session` reads it. */
function session(day: number) {
  return {
    startTime: new Date(Date.UTC(2026, 10, day, 7)),
    endTime: new Date(Date.UTC(2026, 10, day, 8)),
  };
}

/** The same hour as an appointment row, which also records when the Advisor is free again. */
function booked(day: number) {
  const times = session(day);
  return { ...times, unavailableUntil: times.endTime };
}

/**
 * The Advisee's transaction history against real Postgres: ownership through the appointments an
 * invoice pays for, one row per invoice however many appointments it covers, and the invoice
 * number the database assigns on insert.
 */
describe('PaymentServiceInvoicesRepository advisee invoices (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: PaymentServiceInvoicesRepository;
  let setupComplete = false;
  const advisorId = crypto.randomUUID();
  const adviseeId = crypto.randomUUID();
  const otherAdviseeId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();
  // Two appointments on one invoice, the later one inserted first, so "earliest" cannot be
  // insertion order by accident.
  const laterSessionId = crypto.randomUUID();
  const earlierSessionId = crypto.randomUUID();
  const cancelledSessionId = crypto.randomUUID();
  const otherSessionId = crypto.randomUUID();
  const twoSessionInvoiceId = crypto.randomUUID();
  const cancelledInvoiceId = crypto.randomUUID();
  const otherInvoiceId = crypto.randomUUID();
  const invoiceIds = [twoSessionInvoiceId, cancelledInvoiceId, otherInvoiceId];

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new PaymentServiceInvoicesRepository(db);

    await db.insert(user).values(
      [advisorId, adviseeId, otherAdviseeId].map((id) => ({
        id,
        email: `${id}@advisee-invoices.example.test`,
        displayName: id === advisorId ? 'Receipt advisor' : 'Receipt payer',
        fullName: 'Advisee Invoices Test',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db
      .insert(advisorProfiles)
      .values({ userId: advisorId, headline: 'Receipt test advisor' });
    await db
      .insert(serviceCategories)
      .values({ id: categoryId, name: 'Receipt test category' });
    await db.insert(availabilityProfiles).values({
      id: profileId,
      advisorId,
      name: 'Receipt test profile',
    });
    await db.insert(services).values({
      id: serviceId,
      advisorId,
      categoryId,
      availabilityProfileId: profileId,
      name: 'Receipt test service',
      priceSatang: 150000,
      durationMinutes: 60,
      isPublished: true,
    });
    await db.insert(serviceAppointments).values([
      {
        id: laterSessionId,
        serviceId,
        advisorId,
        adviseeId,
        state: 'BOOKED',
        ...booked(3),
      },
      {
        id: earlierSessionId,
        serviceId,
        advisorId,
        adviseeId,
        state: 'BOOKED',
        ...booked(2),
      },
      {
        id: cancelledSessionId,
        serviceId,
        advisorId,
        adviseeId,
        state: 'CANCELLED',
        cancelledAt: new Date(Date.UTC(2026, 9, 30)),
        cancelledByUserId: adviseeId,
        blocksAvailability: false,
        ...booked(4),
      },
      {
        id: otherSessionId,
        serviceId,
        advisorId,
        adviseeId: otherAdviseeId,
        state: 'BOOKED',
        ...booked(5),
      },
    ]);
    // Inserted one at a time, oldest first, so the sequence order is known.
    await db.insert(serviceInvoices).values({
      id: twoSessionInvoiceId,
      amountSatang: 300000,
      platformFeeSatang: 60000,
      status: 'HELD_IN_ESCROW',
      createdAt: new Date(Date.UTC(2026, 9, 1)),
      paidAt: new Date(Date.UTC(2026, 9, 1, 0, 2)),
      cardBrand: 'Visa',
      cardLastDigits: '4242',
    });
    await db.insert(serviceInvoices).values({
      id: cancelledInvoiceId,
      amountSatang: 150000,
      platformFeeSatang: 30000,
      status: 'REFUNDED',
      createdAt: new Date(Date.UTC(2026, 9, 2)),
    });
    await db.insert(serviceInvoices).values({
      id: otherInvoiceId,
      amountSatang: 150000,
      platformFeeSatang: 30000,
      status: 'PENDING',
      createdAt: new Date(Date.UTC(2026, 9, 3)),
    });
    await db.insert(serviceAppointmentsOnInvoice).values([
      {
        serviceAppointmentId: laterSessionId,
        serviceInvoiceId: twoSessionInvoiceId,
      },
      {
        serviceAppointmentId: earlierSessionId,
        serviceInvoiceId: twoSessionInvoiceId,
      },
      {
        serviceAppointmentId: cancelledSessionId,
        serviceInvoiceId: cancelledInvoiceId,
      },
      {
        serviceAppointmentId: otherSessionId,
        serviceInvoiceId: otherInvoiceId,
      },
    ]);
    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await pool?.end();
      return;
    }
    await db
      .delete(serviceAppointmentsOnInvoice)
      .where(
        inArray(serviceAppointmentsOnInvoice.serviceInvoiceId, invoiceIds),
      );
    await db
      .delete(serviceInvoices)
      .where(inArray(serviceInvoices.id, invoiceIds));
    await db
      .delete(serviceAppointments)
      .where(eq(serviceAppointments.serviceId, serviceId));
    await db.delete(services).where(eq(services.id, serviceId));
    await db
      .delete(availabilityProfiles)
      .where(eq(availabilityProfiles.id, profileId));
    await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId));
    await db
      .delete(advisorProfiles)
      .where(eq(advisorProfiles.userId, advisorId));
    await db
      .delete(user)
      .where(inArray(user.id, [advisorId, adviseeId, otherAdviseeId]));
    await pool.end();
  });

  it("lists only the Advisee's invoices, newest first, each with its earliest appointment", async () => {
    const rows = await repository.findManyForAdvisee(adviseeId, {
      limit: 20,
      offset: 0,
    });

    expect(rows.map((row) => row.invoice.id)).toEqual([
      cancelledInvoiceId,
      twoSessionInvoiceId,
    ]);
    expect(rows[1]).toMatchObject({
      invoice: {
        status: 'HELD_IN_ESCROW',
        amountSatang: 300000,
        platformFeeSatang: 60000,
        cardBrand: 'Visa',
        cardLastDigits: '4242',
      },
      service: { id: serviceId, name: 'Receipt test service' },
      advisor: { id: advisorId, displayName: 'Receipt advisor' },
      appointment: { ...session(2), state: 'BOOKED', cancelledAt: null },
    });
    expect(rows[0].appointment).toMatchObject({
      state: 'CANCELLED',
      cancelledAt: new Date(Date.UTC(2026, 9, 30)),
    });
  });

  it('counts an invoice once however many appointments it pays for', async () => {
    await expect(repository.countForAdvisee(adviseeId)).resolves.toBe(2);
    await expect(repository.countForAdvisee(otherAdviseeId)).resolves.toBe(1);
  });

  it('pages by limit and offset in the same order', async () => {
    const rows = await repository.findManyForAdvisee(adviseeId, {
      limit: 1,
      offset: 1,
    });

    expect(rows.map((row) => row.invoice.id)).toEqual([twoSessionInvoiceId]);
  });

  it("finds the user's own invoice, and nothing of anyone else's or of a missing id", async () => {
    await expect(
      repository.findOneForAdvisee(twoSessionInvoiceId, adviseeId),
    ).resolves.toMatchObject({ appointment: session(2) });
    await expect(
      repository.findOneForAdvisee(otherInvoiceId, adviseeId),
    ).resolves.toBeUndefined();
    await expect(
      repository.findOneForAdvisee(crypto.randomUUID(), adviseeId),
    ).resolves.toBeUndefined();
  });

  it('resolves both sessions to the same invoice without leaking another payer’s booking', async () => {
    for (const bookingId of [earlierSessionId, laterSessionId]) {
      await expect(
        repository.findForBooking(bookingId, adviseeId),
      ).resolves.toMatchObject({
        invoice: { id: twoSessionInvoiceId },
      });
    }
    await expect(
      repository.findForBooking(otherSessionId, adviseeId),
    ).resolves.toBeUndefined();
    await expect(
      repository.findForBooking(crypto.randomUUID(), adviseeId),
    ).resolves.toBeUndefined();
  });

  it('numbers every invoice from the database sequence, in insert order', async () => {
    const rows = await db
      .select({
        id: serviceInvoices.id,
        invoiceNumber: serviceInvoices.invoiceNumber,
      })
      .from(serviceInvoices)
      .where(inArray(serviceInvoices.id, invoiceIds));
    const numberOf = (id: string) =>
      rows.find((row) => row.id === id)?.invoiceNumber ?? '';

    for (const id of invoiceIds) {
      expect(numberOf(id)).toMatch(/^INV-\d{4}-\d{6,}$/);
    }
    const sequenceValues = invoiceIds.map((id) =>
      Number(numberOf(id).split('-')[2]),
    );
    expect(sequenceValues).toEqual([...sequenceValues].sort((a, b) => a - b));
    expect(new Set(sequenceValues).size).toBe(invoiceIds.length);
  });
});
