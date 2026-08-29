import type { InferSelectModel } from 'drizzle-orm';
import type {
  availabilityBlockedPeriods,
  availabilityProfiles,
  availabilitySpecificWindows,
  availabilityWeeklyWindows,
} from '@/database/schema';

export interface AvailabilityProfileDetails {
  profile: InferSelectModel<typeof availabilityProfiles>;
  weeklyWindows: InferSelectModel<typeof availabilityWeeklyWindows>[];
  specificWindows: InferSelectModel<typeof availabilitySpecificWindows>[];
  blockedPeriods: InferSelectModel<typeof availabilityBlockedPeriods>[];
}
