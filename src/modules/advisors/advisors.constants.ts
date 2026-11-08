/** The levels an admin can give an Advisor, lowest first (`advisor_profiles.level`). */
export const ADVISOR_LEVELS = [1, 2, 3] as const;
export type AdvisorLevel = (typeof ADVISOR_LEVELS)[number];

export const ADVISOR_MESSAGES = {
  created: 'Advisor application created',
  updated: 'Advisor profile updated',
  alreadyExists: 'User has already applied to be an advisor',
  notFound: 'Advisor profile not found',
  backgroundUpdated: 'Advisor background updated',
  backgroundEndsBeforeStart: 'An entry ends before it starts',
} as const;
