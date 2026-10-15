import { crudMessages } from '@/common/constants/crud-messages';

export const PDPA_MESSAGES = crudMessages('PDPA consent');

/**
 * A policy version is an identifier the client echoes back from the policy it displayed,
 * not free text, so it stays short enough to read in an audit.
 */
export const MAX_POLICY_VERSION_LENGTH = 50;
