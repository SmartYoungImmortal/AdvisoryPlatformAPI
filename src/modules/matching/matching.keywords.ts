/**
 * Matching without a model: the problem's words found in each service's own
 * words. Thai has no spaces between words, so `Intl.Segmenter` splits it, and
 * neighbouring pieces are rejoined so a loanword it cuts apart ("ฟรีแลนซ์" into
 * "ฟรี", "แลน", "ซ์") is still found whole. The frontend ranks the same way when
 * it cannot reach this route at all.
 */

/** Words that say nothing about the problem, in either language. */
const STOPWORDS = new Set([
  'ผม',
  'ฉัน',
  'ดิฉัน',
  'เรา',
  'หนู',
  'อยาก',
  'ต้องการ',
  'ให้',
  'ช่วย',
  'เรื่อง',
  'เกี่ยวกับ',
  'คือ',
  'และ',
  'หรือ',
  'ที่',
  'ของ',
  'ได้',
  'ไม่',
  'มี',
  'เป็น',
  'จะ',
  'ครับ',
  'ค่ะ',
  'คะ',
  'นะ',
  'ด้วย',
  'ยังไง',
  'อย่างไร',
  'แบบ',
  'ไหน',
  'อะไร',
  'กับ',
  'ใน',
  'แล้ว',
  'ก็',
  'ว่า',
  'การ',
  'ความ',
  'ต้อง',
  'เพิ่ง',
  'เริ่ม',
  'แน่ใจ',
  'ไม่แน่ใจ',
  'ยัง',
  'จาก',
  'กำลัง',
  'ตอนนี้',
  'รับ',
  'ทำ',
  'ไป',
  'มา',
  'อยู่',
  'ตัว',
  'คน',
  'เท่า',
  'the',
  'and',
  'for',
  'with',
  'how',
  'what',
  'need',
  'want',
]);

export function piecesOf(text: string): string[] {
  const lower = text.toLowerCase();
  if (typeof Intl.Segmenter !== 'function') {
    return lower.split(/[\s,.;:!?()"'/\\-]+/).filter(Boolean);
  }
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
  return [...segmenter.segment(lower)]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment.trim());
}

/** Runs of one to three pieces found in `haystack`, keeping only the longest of overlapping finds. */
export function matchedIn(
  pieces: readonly string[],
  haystack: string,
): string[] {
  const found = new Set<string>();
  for (let start = 0; start < pieces.length; start++) {
    for (
      let length = 1;
      length <= 3 && start + length <= pieces.length;
      length++
    ) {
      const parts = pieces.slice(start, start + length);
      const run = parts.join('');
      // A run of nothing but filler ("แบบ" + "ไหน") says no more than its pieces.
      const filler = parts.every((part) => STOPWORDS.has(part));
      if (
        run.length >= 3 &&
        !filler &&
        !STOPWORDS.has(run) &&
        haystack.includes(run)
      ) {
        found.add(run);
      }
    }
  }
  const runs = [...found];
  return runs.filter(
    (run) => !runs.some((other) => other !== run && other.includes(run)),
  );
}
