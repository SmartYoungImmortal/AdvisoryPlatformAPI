import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { AppModule } from '@/app.module';
import type { DrizzleDB } from '@/database/database.module';
import { DRIZZLE } from '@/database/database.module';
import {
  serviceAppointments,
  serviceAppointmentsOnInvoice,
  serviceInvoices,
} from '@/database/schema';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp } from '@/app.factory';
import { signUpUser } from './support/accounts';
import {
  createBookingFixtureIds,
  deleteBookingFixtures,
  seedAdvisorService,
} from './support/booking-fixtures';
import { data, stringField } from './support/response';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { ChargeStatus } from '@/modules/payment/providers/providers';

/**
 * Booking a time through payments: an invoice holds the appointments it pays
 * for (through `service_appointments_on_service_invoices`), and checkout charges
 * the invoice's amount on the card and hands back the 3-D Secure address. The
 * card network is the one boundary stubbed; HTTP, auth and Postgres are real.
 */
describe('PaymentController (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const ids = createBookingFixtureIds();
  const charges: [SessionUser, number, string, string][] = [];
  const paymentProvider: IPaymentProvider = {
    chargeSpecificCard(...args): Promise<ChargeStatus> {
      charges.push(args);
      return Promise.resolve({
        status: 'success',
        brand: 'Visa',
        lastDigits: '4242',
        chargeId: 'chrg_test_checkout',
        redirectUrl: 'https://pay.omise.co/charges/chrg_test/authorize',
      });
    },
    getChargeStatus(): Promise<ChargeStatus> {
      return Promise.resolve({ status: 'pending' });
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IPaymentProvider)
      .useValue(paymentProvider)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();

    db = app.get<DrizzleDB>(DRIZZLE);
  });

  afterEach(async () => {
    await deleteBookingFixtures(db, ids);
  });

  afterAll(async () => {
    await app.close();
  });

  it('invoices the chosen times, then charges that amount and returns the 3-D Secure address', async () => {
    const seeded = await seedAdvisorService({ app, db }, ids, {
      label: 'Payment',
    });
    const advisee = await signUpUser(app, 'Payer', ids.userIds);
    const startTime = seeded.slotAt('09:00');

    const created = await advisee.agent
      .post('/api/v1/payment/invoice')
      .send({ serviceId: seeded.serviceId, startTimes: [startTime] })
      .expect(201);
    const invoiceId = stringField(data(created.body), 'id');

    // The invoice reaches the appointment it pays for through the junction.
    const [link] = await db
      .select({
        appointmentId: serviceAppointmentsOnInvoice.serviceAppointmentId,
      })
      .from(serviceAppointmentsOnInvoice)
      .where(eq(serviceAppointmentsOnInvoice.serviceInvoiceId, invoiceId));
    const [appointment] = await db
      .select({
        adviseeId: serviceAppointments.adviseeId,
        startTime: serviceAppointments.startTime,
      })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.id, link.appointmentId));
    expect(appointment.adviseeId).toBe(advisee.userId);
    expect(appointment.startTime.toISOString()).toBe(startTime);

    const checkout = await advisee.agent
      .post('/api/v1/payment/checkout')
      .send({ invoiceId, cardToken: 'tokn_test_checkout' })
      .expect(201);

    expect(stringField(data(checkout.body), 'url')).toMatch(
      /^https:\/\/(pay|api)\.omise\.co\//,
    );
    const [invoice] = await db
      .select({
        amountSatang: serviceInvoices.amountSatang,
        providerChargeId: serviceInvoices.providerChargeId,
        cardBrand: serviceInvoices.cardBrand,
        cardLastDigits: serviceInvoices.cardLastDigits,
        paidAt: serviceInvoices.paidAt,
      })
      .from(serviceInvoices)
      .where(eq(serviceInvoices.id, invoiceId));
    expect(charges).toHaveLength(1);
    const [payer, amount, cardToken, redirectUri] = charges[0];
    expect(payer.id).toBe(advisee.userId);
    expect(amount).toBe(invoice.amountSatang);
    expect(cardToken).toBe('tokn_test_checkout');
    expect(redirectUri).toContain(`/api/v1/payment/callback/${invoiceId}`);
    expect(invoice.providerChargeId).toBe('chrg_test_checkout');
    // The charge names its card; its outcome waits for the 3-D Secure return.
    expect(invoice).toMatchObject({
      cardBrand: 'Visa',
      cardLastDigits: '4242',
      paidAt: null,
    });
  });

  it("lists the Advisee's invoices as receipts, and hides them from everyone else", async () => {
    const seeded = await seedAdvisorService({ app, db }, ids, {
      label: 'Receipt',
    });
    const advisee = await signUpUser(app, 'Receipt payer', ids.userIds);
    const stranger = await signUpUser(app, 'Receipt stranger', ids.userIds);
    const startTime = seeded.slotAt('10:00');
    const created = await advisee.agent
      .post('/api/v1/payment/invoice')
      .send({ serviceId: seeded.serviceId, startTimes: [startTime] })
      .expect(201);
    const invoiceId = stringField(data(created.body), 'id');

    const list = await advisee.agent
      .get('/api/v1/payment/invoices?page=1&limit=20')
      .expect(200);
    expect(data(list.body)).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const items = data(list.body).items as Record<string, unknown>[];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: invoiceId,
      status: 'pending',
      refundSatang: null,
      paidAt: null,
      service: { id: seeded.serviceId },
      session: { startTime },
      booking: 'unconfirmed',
      card: null,
    });
    expect(stringField(items[0], 'invoiceNumber')).toMatch(
      /^INV-\d{4}-\d{6,}$/,
    );

    const receipt = await advisee.agent
      .get(`/api/v1/payment/invoices/${invoiceId}`)
      .expect(200);
    expect(data(receipt.body)).toEqual(items[0]);

    await stranger.agent
      .get(`/api/v1/payment/invoices/${invoiceId}`)
      .expect(404);
    const strangerList = await stranger.agent
      .get('/api/v1/payment/invoices')
      .expect(200);
    expect(data(strangerList.body)).toMatchObject({ items: [], total: 0 });
  });
});
