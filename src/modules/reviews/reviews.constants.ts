import { crudMessages } from '@/common/constants/crud-messages';

/**
 * A review is a property of one appointment, so `service_reviews` takes the appointment's id
 * as its primary key. That is what makes "already reviewed" a 409 rather than a second row.
 */
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
