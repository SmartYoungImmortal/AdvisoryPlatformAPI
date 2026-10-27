import {
  currentLocale,
  localeFromHeader,
  runWithLocale,
} from './request-locale';

describe('localeFromHeader', () => {
  it.each([
    ['en', 'en'],
    ['en-US,en;q=0.9', 'en'],
    ['EN-gb', 'en'],
    ['th', 'th'],
    ['th-TH,th;q=0.9,en;q=0.8', 'th'],
    ['fr', 'th'],
    ['', 'th'],
  ])('reads %j as %s', (header, expected) => {
    expect(localeFromHeader(header)).toBe(expected);
  });

  it('falls back to Thai when the header is missing', () => {
    expect(localeFromHeader(undefined)).toBe('th');
  });

  it('reads the first value of a repeated header', () => {
    expect(localeFromHeader(['en', 'th'])).toBe('en');
  });
});

describe('currentLocale', () => {
  it('is Thai outside a request', () => {
    expect(currentLocale()).toBe('th');
  });

  it('is the locale of the run it is read in, across awaits', async () => {
    await runWithLocale('en', async () => {
      await Promise.resolve();
      expect(currentLocale()).toBe('en');
    });
    expect(currentLocale()).toBe('th');
  });
});
