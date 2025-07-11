import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : exception;

    const requestDetails = {
      method: request.method,
      url: request.url,
      body: request.body,
    };

    let errorMessage = 'Internal server error';
    if (exception instanceof BadRequestException) {
      const validationErrors = exceptionResponse['message'] || exceptionResponse;
      errorMessage = Array.isArray(validationErrors) ? validationErrors.join(', ') : validationErrors;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse['message']) {
      errorMessage = exceptionResponse['message'];
    } else if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    }

    const errorResponse = {
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `Exception: ${errorMessage} | Request: ${JSON.stringify(requestDetails)}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
} 