import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { SmsNotificationProvider } from './providers/sms-notification.provider';
import { Notification } from './entities/notification.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification]),
    CommonModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailNotificationProvider,
    SmsNotificationProvider,
  ],
  exports: [NotificationService, EmailNotificationProvider, SmsNotificationProvider],
})
export class NotificationModule {}
