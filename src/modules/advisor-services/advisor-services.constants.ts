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
  packageNotFound: 'Package not found on this service',
  relatedServiceNotOwned:
    'A service shown beside this one must be another of your own',
} as const;

/** How many of the advisor's other services a service's page may be set to show. */
export const MAX_RELATED_SERVICES = 3;

export const MAX_SERVICE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SERVICE_IMAGES = 6;
