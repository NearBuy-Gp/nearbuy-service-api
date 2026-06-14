import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.resolveError(exception);

    const body: ErrorResponseBody = {
      success: false,
      statusCode,
      error,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method} ${request.url}] ${error}: ${Array.isArray(message) ? message.join(' | ') : message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method} ${request.url}] ${error}: ${Array.isArray(message) ? message.join(' | ') : message}`);
    }

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown): { statusCode: number; error: string; message: string | string[] } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { statusCode, error: exception.name, message: res };
      }

      const obj = res as { message?: string | string[]; error?: string };
      return {
        statusCode,
        error: obj.error ?? exception.name,
        message: obj.message ?? exception.message,
      };
    }

    if (exception instanceof MongooseError.ValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'ValidationError',
        message: Object.values(exception.errors).map((e) => e.message),
      };
    }

    if (exception instanceof MongooseError.CastError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'CastError',
        message: `Invalid value for field "${exception.path}".`,
      };
    }

    if (this.isMongoDuplicateKeyError(exception)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        error: 'DuplicateKeyError',
        message: 'A record with the provided unique field already exists.',
      };
    }

    if (exception instanceof SyntaxError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'SyntaxError',
        message: 'Malformed request payload.',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }

  private isMongoDuplicateKeyError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as { code?: number }).code === 11000
    );
  }
}
