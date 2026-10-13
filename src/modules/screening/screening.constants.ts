import { crudMessages } from '@/common/constants/crud-messages';

/**
 * Screening is a per-Service gate: an Advisee answers the Advisor's questions and may only see
 * slots and book once the Advisor accepts (`AvailabilityService` already enforces the gate).
 */
export const SCREENING_MESSAGES = {
  ...crudMessages('Screening request'),
  questionsFound: 'Screening questions found',
  questionsSaved: 'Screening questions saved',
  submitted: 'Screening answers submitted',
  accepted: 'Screening request accepted',
  declined: 'Screening request declined',
  serviceNotFound: 'Service not found',
  notScreened: 'This service does not use screening',
  noQuestions: 'This service has no screening questions yet',
  ownService: 'You cannot apply to your own service',
  alreadyPending:
    'You already have a screening request waiting for this service',
  alreadyAccepted: 'You have already been accepted for this service',
  alreadyDecided: 'This screening request has already been decided',
  invalidAnswers:
    'Answer every required question, once each, and only the questions asked',
} as const;

/** Copper's decisions of 2026-10-03: at most five text questions, answers up to 1,000 chars. */
export const SCREENING_MAX_QUESTIONS = 5;
export const SCREENING_QUESTION_MAX_LENGTH = 500;
export const SCREENING_ANSWER_MAX_LENGTH = 1_000;
export const SCREENING_DECLINE_MESSAGE_MAX_LENGTH = 1_000;

/** The one status a decision may be applied from; the others are terminal. */
export const SCREENING_PENDING_STATUS = 'PENDING';

/**
 * Notification text is shown to Thai users, so it is Thai. The request and acceptance wording is
 * the Figma notification center's copy; the decline title is the declined screen's
 * (`screening.declinedTitle` in the frontend's `messages/th.json`).
 */
export const SCREENING_NOTIFICATIONS = {
  requestedTitle: 'มีคำขอคัดกรองใหม่',
  requestedContent: (adviseeName: string, answerCount: number) =>
    `${adviseeName} ส่งคำตอบคัดกรอง ${answerCount} ข้อ`,
  acceptedTitle: 'อนุมัติคำขอปรึกษาแล้ว',
  acceptedContent: (advisorName: string) =>
    `${advisorName} รับคำขอ จองเวลาได้เลย`,
  declinedTitle: 'ที่ปรึกษาคนนี้ยังไม่ว่าง',
} as const;
