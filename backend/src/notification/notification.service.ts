import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  NotificationProvider, 
  NotificationChannel, 
  SendNotificationOptions, 
  NotificationResult,
  NotificationType 
} from './interfaces/notification.interface';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { SmsNotificationProvider } from './providers/sms-notification.provider';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class NotificationService {
  private readonly providers = new Map<NotificationChannel, NotificationProvider>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private emailProvider: EmailNotificationProvider,
    private smsProvider: SmsNotificationProvider,
    private readonly logger: LoggerService,
  ) {
    this.registerProviders();
  }

  private registerProviders(): void {
    this.providers.set(NotificationChannel.EMAIL, this.emailProvider);
    this.providers.set(NotificationChannel.SMS, this.smsProvider);
  }

  async sendNotification(options: SendNotificationOptions): Promise<NotificationResult> {
    const provider = this.providers.get(options.channel);
    
    if (!provider) {
      const error = `No provider found for channel: ${options.channel}`;
      this.logger.error(error, undefined, 'NotificationService');
      return { success: false, error };
    }

    if (!provider.validateRecipient(options.recipient)) {
      const error = `Invalid recipient for channel: ${options.channel}`;
      this.logger.error(error, undefined, 'NotificationService');
      return { success: false, error };
    }

    try {
      const result = await provider.send(options);
      
      // Save notification to database
      const notificationData = {
        channel: options.channel,
        type: options.type,
        status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        recipientEmail: options.recipient.email || '',
        recipientPhone: options.recipient.phone,
        recipientName: options.recipient.name,
        subject: this.getSubjectForType(options.type),
        content: this.getContentPreview(options),
        errorMessage: result.success ? undefined : result.error,
      };


      this.logger.logWithMetadata('info', 'Notification data to be saved', notificationData, 'NotificationService');
      const notification = this.notificationRepository.create(notificationData);
      
      await this.notificationRepository.save(notification);
      this.logger.logWithMetadata('info', 'Notification entity created', notification, 'NotificationService');
      
      if (result.success) {
        this.logger.log(`Notification sent successfully via ${options.channel} to ${this.getRecipientIdentifier(options)}`, 'NotificationService');
      } else {
        this.logger.error(`Failed to send notification via ${options.channel}: ${result.error}`, undefined, 'NotificationService');
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Unexpected error sending notification via ${options.channel}: ${error.message}`, error.stack, 'NotificationService');
      
      // Save failed notification to database
      try {
        const notification = this.notificationRepository.create({
          channel: options.channel,
          type: options.type,
          status: NotificationStatus.FAILED,
          recipientEmail: options.recipient.email || '',
          recipientPhone: options.recipient.phone,
          recipientName: options.recipient.name,
          subject: this.getSubjectForType(options.type),
          content: this.getContentPreview(options),
          errorMessage: error.message,
        });
        await this.notificationRepository.save(notification);
      } catch (dbError) {
        this.logger.error(`Failed to save notification to database: ${dbError.message}`, dbError.stack, 'NotificationService');
      }
      
      return { success: false, error: error.message };
    }
  }

  async sendMultiChannelNotification(
    options: Omit<SendNotificationOptions, 'channel'>,
    channels: NotificationChannel[]
  ): Promise<NotificationResult[]> {
    const promises = channels.map(channel => 
      this.sendNotification({ ...options, channel })
    );
    
    return Promise.all(promises);
  }

  async sendVerificationNotification(
    email: string, 
    token: string, 
    patientName?: string,
    phone?: string
  ): Promise<NotificationResult[]> {
    const recipient = { email, phone, name: patientName };
    const templateData = { 
      patientName, 
      verificationUrl: `${process.env.BASE_URL}/${process.env.API_PREFIX}/${process.env.API_VERSION}/auth/verify-email?token=${token}`,
      verificationCode: token.substring(0, 6).toUpperCase() // For SMS
    };

    const channels: NotificationChannel[] = [NotificationChannel.EMAIL];
    
    if (phone && process.env.SMS_ENABLED === 'true') {
      channels.push(NotificationChannel.SMS);
    }

    return this.sendMultiChannelNotification({
      type: NotificationType.EMAIL_VERIFICATION,
      recipient,
      templateData,
      priority: 'high'
    }, channels);
  }

  private getRecipientIdentifier(options: SendNotificationOptions): string {
    switch (options.channel) {
      case NotificationChannel.EMAIL:
        return options.recipient.email || 'unknown';
      case NotificationChannel.SMS:
        return options.recipient.phone || 'unknown';
      default:
        return options.recipient.userId || 'unknown';
    }
  }

  private getSubjectForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.EMAIL_VERIFICATION:
        return 'Email Verification Required';
      case NotificationType.APPOINTMENT_REMINDER:
        return 'Appointment Reminder';
      case NotificationType.SYSTEM_ALERT:
        return 'System Alert';
      case NotificationType.WELCOME:
        return 'Welcome';
      default:
        return 'Notification';
    }
  }

  private getContentPreview(options: SendNotificationOptions): string {
    const recipient = this.getRecipientIdentifier(options);
    return `${options.type} notification sent to ${recipient}`;
  }

  async getNotifications(limit: number = 50): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getNotificationsByEmail(email: string, limit: number = 20): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientEmail: email },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

}
