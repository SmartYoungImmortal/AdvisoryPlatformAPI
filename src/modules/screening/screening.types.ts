import type { InferSelectModel } from 'drizzle-orm';
import type {
  screeningRequests,
  serviceScreeningQuestions,
} from '@/database/schema';

export type ScreeningRequest = InferSelectModel<typeof screeningRequests>;
export type ScreeningStatus = ScreeningRequest['status'];
export type ScreeningQuestion = InferSelectModel<
  typeof serviceScreeningQuestions
>;

/** The Service fields that screening needs. */
export interface ScreeningService {
  id: string;
  name: string;
  advisorId: string;
  screeningRequired: boolean;
}

/** A question sent by the Advisor, before it is saved. */
export interface ScreeningQuestionInput {
  question: string;
  isRequired: boolean;
}

/** An answer ready to save, with a copy of the question text. */
export interface ScreeningAnswerInput {
  questionId: string;
  questionText: string;
  answer: string;
}

/** One row of the Advisor's request list. */
export interface AdvisorScreeningRequestRow {
  id: string;
  serviceId: string;
  serviceName: string;
  adviseeId: string;
  adviseeDisplayName: string;
  status: ScreeningStatus;
  decisionReason: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  viewedAt: Date | null;
}

export interface ScreeningAnswerRow {
  questionId: string;
  questionText: string;
  answer: string;
}

/** A notification saved in the same transaction as the action that caused it. */
export interface ScreeningNotification {
  ownerId: string;
  type: 'SCREENING_REQUESTED' | 'SCREENING_DECIDED';
  title: string;
  content: string | null;
  /**
   * The request id in the Advisor's notification; the Service id in the Advisee's, because their
   * status is per Service.
   */
  resourceId?: string;
}
