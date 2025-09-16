import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  NotificationProvider, 
  NotificationChannel, 
  SendNotificationOptions, 
  NotificationResult,
  NotificationRecipient,
  NotificationType 
} from '../interfaces/notification.interface';
import { LoggerService } from '../../common/logger/logger.service';

interface SmsConfig {
  provider: 'twilio' | 'aws-sns' | 'vonage';
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
  enabled: boolean;
}

@Injectable()
export class SmsNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.SMS;
  private readonly smsConfig: SmsConfig;

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const config = this.configService.get<SmsConfig>('sms');
    if (!config || !config.enabled) {
      this.logger.warn('SMS configuration is missing or disabled - SMS notifications will not work', 'SmsNotificationProvider');

      this.smsConfig = {
        provider: 'twilio',
        apiKey: '',
        apiSecret: '',
        fromNumber: '',
        enabled: false,
      };
    } else {
      this.smsConfig = config;
    }
    this.initializeProvider();
  }

  private initializeProvider(): void {
    // To be implemented
    this.logger.log('SMS provider initialized', 'SmsNotificationProvider');
  }

  validateRecipient(recipient: NotificationRecipient): boolean {
    return !!(recipient.phone && this.isValidPhoneNumber(recipient.phone));
  }

  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  async send(options: SendNotificationOptions): Promise<NotificationResult> {
    try {
      if (!this.validateRecipient(options.recipient)) {
        return {
          success: false,
          error: 'Invalid phone number recipient',
        };
      }

      const message = this.getTemplate(options.type, options.templateData);

      const result = await this.sendSms(options.recipient.phone!, message);
      
      this.logger.log(`SMS would be sent to ${options.recipient.phone}: ${message.substring(0, 50)}...`, 'SmsNotificationProvider');

      if (result) {
        this.logger.logWithMetadata('info', 'SMS sent successfully', result, 'SmsNotificationProvider');
      } else {
        this.logger.logWithMetadata('warn', 'SMS sending failed', result, 'SmsNotificationProvider');
      }

      return {
        success: true,
        messageId: `sms_${Date.now()}`,
        metadata: {
          to: options.recipient.phone,
          messageLength: message.length,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${options.recipient.phone}: ${error.message}`, error.stack, 'SmsNotificationProvider');
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getTemplate(type: NotificationType, templateData?: Record<string, any>): string {
    switch (type) {
      case NotificationType.EMAIL_VERIFICATION:
        const code = templateData?.verificationCode || 'N/A';
        return `Your verification code is: ${code}. Use this code to verify your email address.`;
      
      case NotificationType.APPOINTMENT_REMINDER:
        const appointmentDate = templateData?.appointmentDate || 'soon';
        return `Reminder: You have an appointment scheduled for ${appointmentDate}.`;
      
      case NotificationType.WELCOME:
        const name = templateData?.patientName || 'there';
        return `Welcome ${name}! Thank you for registering with our patient management system.`;
      
      case NotificationType.SYSTEM_ALERT:
        const alertMessage = templateData?.message || 'System notification';
        return alertMessage;
      
      default:
        return `Notification: ${type}`;
    }
  }

  private async sendSms(phoneNumber: string, message: string): Promise<any> {
    if (!this.smsConfig.enabled) {
      this.logger.log(`SMS disabled - would send to ${phoneNumber}: ${message}`, 'SmsNotificationProvider');
      return { success: true, mockSent: true };
    }

    // For now, just log the SMS that would be sent
    // In production, implement actual SMS provider (Twilio, AWS SNS, etc.)
    this.logger.log(`📱 SMS would be sent to ${phoneNumber}: ${message}`, 'SmsNotificationProvider');
    
    return {
      success: true,
      messageId: `mock_sms_${Date.now()}`,
      provider: this.smsConfig.provider,
    };
  }
}
