const PREVIEW_LENGTH = 140;

/** The start of a long text, cut with "…", for a notification that quotes what someone wrote. */
export function previewText(text: string): string {
  return text.length > PREVIEW_LENGTH
    ? `${text.slice(0, PREVIEW_LENGTH)}…`
    : text;
}
