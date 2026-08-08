import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  const createContext = (): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }),
      }),
    }) as unknown as ExecutionContext;

  const createCallHandler = (data: unknown): CallHandler =>
    ({ handle: () => of(data) }) as CallHandler;

  it('wraps the response with statusCode, message, and data', (done) => {
    const reflector = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const interceptor = new TransformInterceptor(reflector);

    interceptor
      .intercept(createContext(), createCallHandler({ id: '1' }))
      .subscribe((result) => {
        expect(result).toEqual({
          statusCode: 200,
          message: 'Success',
          data: { id: '1' },
        });
        done();
      });
  });

  it('coerces undefined data (e.g. a void DELETE handler) to null, not a dropped key', (done) => {
    const reflector = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const interceptor = new TransformInterceptor(reflector);

    interceptor
      .intercept(createContext(), createCallHandler(undefined))
      .subscribe((result) => {
        expect(result.data).toBeNull();
        expect(JSON.stringify(result)).toContain('"data":null');
        done();
      });
  });

  it('uses the message set via @ResponseMessage instead of the default', (done) => {
    const reflector = {
      get: jest.fn().mockReturnValue('Booking created'),
    } as unknown as Reflector;
    const interceptor = new TransformInterceptor(reflector);

    interceptor
      .intercept(createContext(), createCallHandler(null))
      .subscribe((result) => {
        expect(result.message).toBe('Booking created');
        expect(reflector.get).toHaveBeenCalledWith(
          RESPONSE_MESSAGE_KEY,
          expect.any(Function),
        );
        done();
      });
  });
});
