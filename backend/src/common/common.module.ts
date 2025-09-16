import { Module } from '@nestjs/common';
import { PaginationService } from './services/pagination.service';
import { LoggerService } from './logger/logger.service';

@Module({
  providers: [PaginationService, LoggerService],
  exports: [PaginationService, LoggerService],
})
export class CommonModule {}
