import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      map(data => {
        const response = {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: 'Success',
          data,
        };

        this.logger.log(
          `${method} ${url} - ${Date.now() - now}ms`,
        );

        return response;
      }),
    );
  }
} 