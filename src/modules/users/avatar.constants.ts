export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_URL_EXPIRY_SECONDS = 5 * 60;

export const AVATAR_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
