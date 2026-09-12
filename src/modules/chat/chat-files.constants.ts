/**
 * The 50 MB ceiling named in the sprint plan. `chat_files_size_range` enforces the same
 * bound in Postgres, so a bypassed application check still cannot store an oversized row.
 */
export const MAX_CHAT_FILE_BYTES = 50 * 1024 * 1024;

export const CHAT_FILE_URL_EXPIRY_SECONDS = 5 * 60;

/** Populates `chat_files.expiry_date`. No sweeper reads it yet; see AP-037. */
export const CHAT_FILE_RETENTION_DAYS = 180;

/**
 * Type enforcement is required by the sprint plan but the accepted list was never
 * specified, so this is the one place to change it. Executables and scripts are absent
 * deliberately: a consultation attachment has no reason to be runnable.
 */
export const CHAT_FILE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'application/zip': 'zip',
};

export function chatFileObjectKey(
  chatRoomId: string,
  extension: string,
): string {
  return `chat-files/${chatRoomId}/${crypto.randomUUID()}.${extension}`;
}

export function chatFileExpiryDate(from: Date): Date {
  const expiry = new Date(from);
  expiry.setUTCDate(expiry.getUTCDate() + CHAT_FILE_RETENTION_DAYS);
  return expiry;
}
