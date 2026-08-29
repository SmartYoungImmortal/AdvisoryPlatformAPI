import { crudMessages } from '@/common/constants/crud-messages';

export const ADVISOR_SERVICE_MESSAGES = {
  ...crudMessages('Service'),
  categoryNotFound: 'Service category not found',
  availabilityProfileNotFound: 'Availability profile not found',
  trialDurationRequired: 'Trial duration is required when trial is enabled',
  trialDurationForbidden:
    'Trial duration is only allowed when trial is enabled',
  publicSearchInvalidPriceRange: 'Minimum price must not exceed maximum price',
  publicSearchUnavailable: 'Service search is temporarily unavailable',
} as const;

export const PUBLIC_SERVICES_SEARCH_INDEX = 'public-services-v1';
