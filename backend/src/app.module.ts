import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as winston from 'winston';

import databaseConfig from './config/database.config';
import { emailConfig } from './config/email.config';
import smsConfig from './config/sms.config';
import { PatientModule } from './patient/patient.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { FilesModule } from './files/files.module';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { winstonConfig } from './config/winston.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, emailConfig, smsConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database')!,
      inject: [ConfigService],
    }),

    WinstonModule.forRoot(winstonConfig),

    EmailModule,
    AuthModule,
    PatientModule,
    NotificationModule,
    FilesModule,
  ],
  controllers: [],
  providers: [
    LoggerService,
    LoggingInterceptor,
  ],
  exports: [
    LoggerService,
    LoggingInterceptor,
  ],
})
export class AppModule {}