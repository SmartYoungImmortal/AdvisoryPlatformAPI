import { previewText } from './preview-text';

describe('previewText', () => {
  it('keeps a short text as it is', () => {
    expect(previewText('สวัสดีครับ')).toBe('สวัสดีครับ');
  });

  it('cuts a long text at 140 characters and adds an ellipsis', () => {
    expect(previewText('a'.repeat(200))).toBe(`${'a'.repeat(140)}…`);
  });
});
