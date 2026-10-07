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

/** The little a Service has to give up for screening to be checked against it. */
export interface ScreeningService {
  id: string;
  name: string;
  advisorId: string;
  screeningRequired: boolean;
}

/** A question as the Advisor submits it, before it has an id or an order. */
export interface ScreeningQuestionInput {
  question: string;
  isRequired: boolean;
}

/** An answer ready to store, with the question text snapshotted beside it. */
export interface ScreeningAnswerInput {
  questionId: string;
  questionText: string;
  answer: string;
}

/** One row of the Advisor's request list: who asked, for which service, and where it stands. */
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

/** A notification row to write in the same transaction as the event that caused it. */
export interface ScreeningNotification {
  ownerId: string;
  type: 'SCREENING_REQUESTED' | 'SCREENING_DECIDED';
  title: string;
  content: string | null;
}
