import { crudMessages } from '@/common/constants/crud-messages';

/**
 * A free trial is a first session the Advisee does not pay for, at the length the Service sets.
 * The Advisee asks for it from the Service's page; the ask opens their chat room with the Advisor,
 * and the Advisor grants or declines it there. Screening does not gate it.
 */
export const TRIAL_MESSAGES = {
  ...crudMessages('Trial request'),
  trialFound: 'Free trial found',
  requested: 'Free trial requested',
  granted: 'Free trial granted',
  declined: 'Free trial declined',
  serviceNotFound: 'Service not found',
  roomNotFound: 'Chat room not found',
  noTrial: 'This service does not offer a free trial',
  ownService: 'You cannot ask for a free trial of your own service',
  alreadyRequested: 'You have already asked for a free trial of this service',
  alreadyDecided: 'This free trial request has already been decided',
} as const;

export const TRIAL_DECLINE_MESSAGE_MAX_LENGTH = 1_000;

/**
 * Notification text. The Thai is the source, kept on the notification row; `en` is the same text
 * in English, written alongside it so a reader sees whichever language they use.
 */
export const TRIAL_NOTIFICATIONS = {
  requestedTitle: 'มีคำขอทดลองฟรี',
  requestedContent: (adviseeName: string, minutes: number, service: string) =>
    `${adviseeName} ขอทดลองฟรี ${minutes} นาที · ${service}`,
  grantedTitle: 'อนุมัติการทดลองฟรีแล้ว',
  grantedContent: (advisorName: string) =>
    `${advisorName} อนุมัติแล้ว เลือกเวลาทดลองได้เลย`,
  declinedTitle: 'คำขอทดลองฟรีไม่ได้รับอนุมัติ',
  en: {
    requestedTitle: 'New free trial request',
    requestedContent: (adviseeName: string, minutes: number, service: string) =>
      `${adviseeName} asked for a free ${minutes}-minute trial · ${service}`,
    grantedTitle: 'Free trial approved',
    grantedContent: (advisorName: string) =>
      `${advisorName} approved it. Pick a time for your trial.`,
    declinedTitle: 'Free trial request declined',
  },
} as const;
