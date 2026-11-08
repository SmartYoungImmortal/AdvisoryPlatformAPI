import type { InferSelectModel } from 'drizzle-orm';
import type {
  availabilityBlockedPeriods,
  availabilityProfiles,
  availabilitySpecificWindows,
  availabilityWeeklyWindows,
  serviceAppointments,
} from '@/database/schema';

export interface AvailabilityProfileDetails {
  profile: InferSelectModel<typeof availabilityProfiles>;
  weeklyWindows: InferSelectModel<typeof availabilityWeeklyWindows>[];
  specificWindows: InferSelectModel<typeof availabilitySpecificWindows>[];
  blockedPeriods: InferSelectModel<typeof availabilityBlockedPeriods>[];
}

export type ReschedulingBooking = Pick<
  InferSelectModel<typeof serviceAppointments>,
  'id' | 'serviceId' | 'adviseeId' | 'startTime' | 'endTime'
>;
