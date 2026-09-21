export const AVAILABILITY_MESSAGES = {
  globalUpdated: 'Global availability updated',
  globalNotFound: 'Global availability not found',
  profileCreated: 'Availability profile created',
  profileUpdated: 'Availability profile updated',
  profileDeleted: 'Availability profile deleted',
  profileNotFound: 'Availability profile not found',
  invalidWindows: 'Availability windows must not overlap',
  invalidRange: 'The requested date range is invalid',
  invalidTimezone: 'Advisor timezone is invalid',
  unavailable: 'Timeslot is not available',
  screeningRequired: 'Accepted screening is required before viewing slots',
} as const;
