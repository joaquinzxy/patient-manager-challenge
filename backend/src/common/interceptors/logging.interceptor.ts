import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { randomUUID } from 'crypto';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, body } = request;

    const traceId = randomUUID();

    request.traceId = traceId;

    this.logger.info('[HTTP REQUEST]', {
      traceId,
      method,
      url,
      ip: request.ip,
      body: this.sanitizeBody(body),
    });

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;

        this.logger.info('[HTTP RESPONSE]', {
          traceId,
          method,
          url,
          statusCode: response.statusCode,
          responseTime: `${delay}ms`,
          responseBody: this.sanitizeBody(data),
        });
      }),
      catchError((error) => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;

        this.logger.error('[HTTP ERROR]', {
          traceId,
          method,
          url,
          statusCode: error.status || response.statusCode || 500,
          responseTime: `${delay}ms`,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
          errorResponse: this.sanitizeBody(error.response),
        });

        return throwError(() => error);
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }
}