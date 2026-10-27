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
  });
});
