import { crudMessages } from '@/common/constants/crud-messages';

/**
 * Screening lets an Advisor ask questions before a booking. The Advisee answers, and can only see
 * time slots and book after the Advisor accepts (`AvailabilityService` checks this).
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

/** At most five text questions per Service; answers up to 1,000 characters. */
export const SCREENING_MAX_QUESTIONS = 5;
export const SCREENING_QUESTION_MAX_LENGTH = 500;
export const SCREENING_ANSWER_MAX_LENGTH = 1_000;
export const SCREENING_DECLINE_MESSAGE_MAX_LENGTH = 1_000;

/**
 * Notification text. The Thai is the source, kept on the notification row, and its wording comes
 * from the Figma designs; `en` is the same text in English, written alongside it so a reader sees
 * whichever language they use.
 */
export const SCREENING_NOTIFICATIONS = {
  requestedTitle: 'มีคำขอคัดกรองใหม่',
  requestedContent: (adviseeName: string, answerCount: number) =>
    `${adviseeName} ส่งคำตอบคัดกรอง ${answerCount} ข้อ`,
  acceptedTitle: 'อนุมัติคำขอปรึกษาแล้ว',
  acceptedContent: (advisorName: string) =>
    `${advisorName} รับคำขอ จองเวลาได้เลย`,
  declinedTitle: 'ที่ปรึกษาคนนี้ยังไม่ว่าง',
  en: {
    requestedTitle: 'New screening request',
    requestedContent: (adviseeName: string, answerCount: number) =>
      `${adviseeName} sent ${answerCount} screening ${answerCount === 1 ? 'answer' : 'answers'}`,
    acceptedTitle: 'Consultation request approved',
    acceptedContent: (advisorName: string) =>
      `${advisorName} accepted your request. You can book a time now.`,
    declinedTitle: 'This advisor isn’t available right now',
  },
} as const;
