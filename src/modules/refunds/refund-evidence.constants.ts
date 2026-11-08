export const MAX_REFUND_EVIDENCE_BYTES = 50 * 1024 * 1024;
export const MAX_REFUND_EVIDENCE_FILES = 5;
export const REFUND_EVIDENCE_URL_SECONDS = 5 * 60;
export const REFUND_EVIDENCE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
export const REFUND_EVIDENCE_MESSAGES = {
  required: 'Choose an evidence file',
  invalidType: 'Choose a JPEG, PNG, WebP or PDF file',
  tooLarge: 'Evidence must be 50 MiB or smaller',
  full: 'A refund case can have at most five evidence files',
  resolved: 'Evidence can only be added to an open refund case',
  unavailable: 'Evidence storage is unavailable',
  notFound: 'Refund evidence not found',
} as const;
