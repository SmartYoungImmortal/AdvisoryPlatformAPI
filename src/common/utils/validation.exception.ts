import { BadRequestException, ValidationError } from '@nestjs/common';

export interface FieldError {
  property: string;
  message: string;
}

export class ValidationException extends BadRequestException {
  public readonly fieldErrors: FieldError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.fieldErrors = ValidationException.flatten(errors);
  }

  private static flatten(errors: ValidationError[]): FieldError[] {
    return errors.flatMap((error) => {
      const ownErrors = Object.values(error.constraints ?? {}).map(
        (message) => ({
          property: error.property,
          message,
        }),
      );
      const nestedErrors = error.children?.length
        ? ValidationException.flatten(error.children)
        : [];
      return [...ownErrors, ...nestedErrors];
    });
  }
}
