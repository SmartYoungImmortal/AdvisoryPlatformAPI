import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import {
  FieldError,
  ValidationException,
} from '@/common/utils/validation.exception';
import { AUTH_MESSAGES } from '@/modules/auth/auth.constants';

interface ErrorEnvelope {
  statusCode: number;
  message: string;
  data: null;
  errors?: FieldError[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ValidationException) {
      const status = exception.getStatus();
      response.status(status).json({
        statusCode: status,
        message: exception.message,
        data: null,
        errors: exception.fieldErrors,
      } satisfies ErrorEnvelope);
      return;
    }

    if (exception instanceof MulterError) {
      const status =
        exception.code === 'LIMIT_FILE_SIZE'
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.BAD_REQUEST;
      response.status(status).json({
        statusCode: status,
        message:
          exception.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded file is too large'
            : 'Invalid file upload',
        data: null,
      } satisfies ErrorEnvelope);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({
        statusCode: status,
        message: AllExceptionsFilter.authenticationMessage(
          status,
          AllExceptionsFilter.extractMessage(exception),
          host.switchToHttp().getRequest<{ headers?: { cookie?: string } }>()
            .headers?.cookie,
        ),
        data: null,
      } satisfies ErrorEnvelope);
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      data: null,
    } satisfies ErrorEnvelope);
  }

  private static extractMessage(exception: HttpException): string {
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return body;
    }

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const { message } = body;
      return Array.isArray(message) ? message.join(', ') : String(message);
    }

    return exception.message;
  }

  private static authenticationMessage(
    status: number,
    message: string,
    cookieHeader: string | undefined,
  ): string {
    if (status !== 401 || message !== 'Unauthorized') {
      return message;
    }

    return AllExceptionsFilter.hasBetterAuthSessionCookie(cookieHeader)
      ? AUTH_MESSAGES.invalidOrExpiredSession
      : AUTH_MESSAGES.authenticationRequired;
  }

  private static hasBetterAuthSessionCookie(
    cookieHeader: string | undefined,
  ): boolean {
    return /(?:^|;\s*)(?:__Secure-)?better-auth[.-]session_token(?:\.\d+)?=/.test(
      cookieHeader ?? '',
    );
  }
}
