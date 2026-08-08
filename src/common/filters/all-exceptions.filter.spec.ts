import {
  ArgumentsHost,
  HttpStatus,
  Logger,
  NotFoundException,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationException } from '../utils/validation.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }) as unknown as Response,
      }),
    } as unknown as ArgumentsHost;
  });

  it('formats a plain HttpException', () => {
    filter.catch(new NotFoundException('Booking not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Booking not found',
      data: null,
    });
  });

  it('formats a ValidationException into field errors', () => {
    const errors: ValidationError[] = [
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
        children: [],
      },
    ];

    filter.catch(new ValidationException(errors), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      data: null,
      errors: [{ property: 'email', message: 'email must be an email' }],
    });
  });

  it('returns a generic 500 for unknown errors and does not leak details', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter.catch(new Error('boom, leaked db connection string'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      data: null,
    });
  });
});
