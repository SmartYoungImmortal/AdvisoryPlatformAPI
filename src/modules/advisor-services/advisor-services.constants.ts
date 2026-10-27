import { crudMessages } from '@/common/constants/crud-messages';

/**
 * How long a presigned service photograph stays readable. Longer than the five
 * minutes private documents get: these are public pictures, and a gallery's
 * later photos load lazily, well after the detail response arrived.
 */
export const SERVICE_IMAGE_URL_EXPIRY_SECONDS = 60 * 60;

export const ADVISOR_SERVICE_MESSAGES = {
  ...crudMessages('Service'),
  categoryNotFound: 'Service category not found',
  availabilityProfileNotFound: 'Availability profile not found',
  trialDurationRequired: 'Trial duration is required when trial is enabled',
  trialDurationForbidden:
    'Trial duration is only allowed when trial is enabled',
  publicSearchInvalidPriceRange: 'Minimum price must not exceed maximum price',
} as const;
