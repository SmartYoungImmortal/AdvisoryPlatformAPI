import { config } from 'dotenv';

config({ quiet: true });

export const TEST_JITSI_APP_ID = 'advisory-platform-test';
export const TEST_JITSI_APP_SECRET =
  'test-only-jitsi-secret-that-is-at-least-32-characters';
export const TEST_JITSI_DOMAIN = 'meet.example.test';

process.env.JITSI_APP_ID ??= TEST_JITSI_APP_ID;
process.env.JITSI_APP_SECRET ??= TEST_JITSI_APP_SECRET;
process.env.JITSI_DOMAIN ??= TEST_JITSI_DOMAIN;
process.env.JITSI_ACCESS_BUFFER_MINUTES ??= '15';
