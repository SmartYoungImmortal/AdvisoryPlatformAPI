/** The picture formats an upload may be, by the extension its stored object is given. */
export type ImageExtension = 'png' | 'jpg' | 'webp';

/**
 * The extension for an uploaded picture, or null when it is not one we keep. The declared type
 * and the file's first bytes must agree, so a renamed file is refused rather than stored.
 */
export function imageExtension(
  file: Pick<Express.Multer.File, 'buffer' | 'mimetype'>,
): ImageExtension | null {
  const { buffer, mimetype } = file;
  const png = buffer
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const webp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';
  if (mimetype === 'image/png' && png) return 'png';
  if (mimetype === 'image/jpeg' && jpeg) return 'jpg';
  if (mimetype === 'image/webp' && webp) return 'webp';
  return null;
}

/**
 * A picture key that is already a fetchable URL rather than a storage key —
 * the demo catalogue's pictures are public URLs. Served unchanged, never removed.
 */
export function isAbsoluteUrl(key: string): boolean {
  return /^https?:\/\//i.test(key);
}
