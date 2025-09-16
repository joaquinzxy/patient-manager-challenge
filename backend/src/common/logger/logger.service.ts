import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  logWithMetadata(level: string, message: string, metadata: any, context?: string) {
    this.logger.log(level, message, { ...metadata, context });
  }

  logRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string) {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userId,
      context: 'HTTP',
    });
  }

  logDatabaseQuery(query: string, parameters: any[], executionTime: number) {
    this.logger.debug('Database Query', {
      query,
      parameters,
      executionTime: `${executionTime}ms`,
      context: 'Database',
    });
  }

  logUserAction(userId: string, action: string, details?: any) {
    this.logger.info('User Action', {
      userId,
      action,
      details,
      context: 'UserAction',
    });
  }
}