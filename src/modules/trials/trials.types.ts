import type { InferSelectModel } from 'drizzle-orm';
import type { trialRequests } from '@/database/schema';

export type TrialRequest = InferSelectModel<typeof trialRequests>;
export type TrialRequestStatus = TrialRequest['status'];

/** The Service fields a free trial needs. `trialDurationMinutes` is null unless it offers one. */
export interface TrialService {
  id: string;
  name: string;
  advisorId: string;
  trialEnabled: boolean;
  trialDurationMinutes: number | null;
}

/** A request with what its card shows about the Service, read in the request's language. */
export interface TrialRequestRow extends TrialRequest {
  serviceName: string;
  advisorId: string;
  /** The Service's trial length now; null if it no longer offers one. */
  trialDurationMinutes: number | null;
  /** The booking the granted trial became, unless it was cancelled; null until it is booked. */
  trialBookingId: string | null;
}
