import type { ArgumentsHost, ValidationError } from '@nestjs/common';
import {
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';
import { ValidationException } from '@/common/utils/validation.exception';
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

  it('formats an oversized upload without leaking Multer details', () => {
    filter.catch(new MulterError('LIMIT_FILE_SIZE'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message: 'Uploaded file is too large',
      data: null,
    });
  });

  it('formats other Multer failures as invalid uploads', () => {
    filter.catch(new MulterError('LIMIT_UNEXPECTED_FILE'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid file upload',
      data: null,
    });
  });

  it.each([
    [new HttpException('plain response', 418), 'plain response'],
    [
      new HttpException({ message: ['first problem', 'second problem'] }, 400),
      'first problem, second problem',
    ],
    [new HttpException({}, 418), 'Http Exception'],
  ])(
    'extracts supported HttpException message shapes',
    (exception, message) => {
      filter.catch(exception, host);

      expect(json).toHaveBeenCalledWith({
        statusCode: exception.getStatus(),
        message,
        data: null,
      });
    },
  );

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

  it('also handles non-Error thrown values without exposing them', () => {
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch('unexpected thrown value', host);

    expect(log).toHaveBeenCalledWith('unexpected thrown value');
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
