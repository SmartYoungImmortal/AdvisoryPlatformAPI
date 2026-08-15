import { Transform, type TransformFnParams } from 'class-transformer';

/** Trims string input before validation while leaving non-strings for validators to reject. */
export function Trim(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    const input: unknown = value;
    return typeof input === 'string' ? input.trim() : input;
  });
}
