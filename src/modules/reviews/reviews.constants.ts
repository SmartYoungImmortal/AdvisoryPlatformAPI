import { crudMessages } from '@/common/constants/crud-messages';

/**
 * A review is a property of one appointment, so `service_reviews` takes the appointment's id
 * as its primary key. That is what makes "already reviewed" a 409 rather than a second row.
 */
/** The advisor's notification when an advisee reviews one of their sessions. */
export const REVIEW_RECEIVED_NOTIFICATION = {
  title: 'คุณได้รับรีวิวใหม่',
  content: (name: string, stars: number) => `${name} ให้ ${stars} ดาว`,
  en: {
    title: 'You have a new review',
    content: (name: string, stars: number) =>
      `${name} gave you ${stars} ${stars === 1 ? 'star' : 'stars'}`,
  },
} as const;

export const REVIEW_MESSAGES = {
  ...crudMessages('Review'),
  alreadyReviewed: 'This consultation has already been reviewed',
  notCompleted: 'A consultation can only be reviewed once it is completed',
  replied: 'Reply saved',
} as const;

/**
 * The only text bound this API already documents is the 4,000-character chat message, so a
 * review comment and an Advisor's reply share it rather than inventing a second number.
 */
export const REVIEW_TEXT_MAX_LENGTH = 4_000;

export const REVIEW_STARS_MIN = 1;
export const REVIEW_STARS_MAX = 5;
