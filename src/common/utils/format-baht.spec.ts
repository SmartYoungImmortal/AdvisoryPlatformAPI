import { formatBaht } from './format-baht';

describe('formatBaht', () => {
  it('groups thousands and drops zero satang', () => {
    expect(formatBaht(126_000)).toBe('฿1,260');
  });

  it('shows satang when there are any', () => {
    expect(formatBaht(126_050)).toBe('฿1,260.50');
  });
});
