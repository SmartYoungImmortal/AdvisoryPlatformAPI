import {
  createBookingFixtureIds,
  deleteBookingFixtures,
} from './booking-fixtures';
import type { BookingFixtureIds } from './booking-fixtures';
import { createE2eApp } from './e2e-app';
import type { BootedE2eApp } from './e2e-app';

/** Shares the real-app boot and disposable-fixture cleanup used by booking e2e suites. */
export function bookingE2eHarness(
  ids: BookingFixtureIds = createBookingFixtureIds(),
  onReady?: (context: BootedE2eApp) => void,
): () => BootedE2eApp {
  let context: BootedE2eApp;

  beforeAll(async () => {
    context = await createE2eApp();
    onReady?.(context);
  });

  afterEach(async () => {
    await deleteBookingFixtures(context.db, ids);
  });

  afterAll(async () => {
    await context.app.close();
  });

  return () => context;
}
