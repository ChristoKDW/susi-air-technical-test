import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FIXED_TODAY } from '../constants/app.constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = HttpStatus[status] || 'Error';
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message ?? exception.message;
        error = body.error ?? HttpStatus[status] ?? 'Error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    // Consistent ISO timestamp anchored to fixed system reference
    const timestamp = `${FIXED_TODAY}T00:00:00.000Z`;

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp,
      path: request.url,
    });
  }
}
