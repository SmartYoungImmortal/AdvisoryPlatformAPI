import { plainToInstance } from 'class-transformer';
import { Trim } from './trim.decorator';

class TrimmedValueDto {
  @Trim()
  value!: unknown;
}

describe('@Trim', () => {
  it('trims strings', () => {
    expect(plainToInstance(TrimmedValueDto, { value: '  hello  ' }).value).toBe(
      'hello',
    );
  });

  it('leaves non-string input for validation to reject or accept', () => {
    expect(plainToInstance(TrimmedValueDto, { value: 42 }).value).toBe(42);
  });
});
