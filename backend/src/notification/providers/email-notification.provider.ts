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
import { EmailConfig } from 'src/config/email.config';
import { LoggerService } from '../../common/logger/logger.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.EMAIL;
  private transporter: nodemailer.Transporter;
  private readonly emailConfig: EmailConfig;

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const config = this.configService.get<EmailConfig>('email');
    if (!config) {
      throw new Error('Email configuration is missing');
    }
    this.emailConfig = config;
    this.createTransporter();
  }

  private createTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      auth: {
        user: this.emailConfig.auth.user,
        pass: this.emailConfig.auth.pass,
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error(`Email service connection failed: ${error.message}`, error.stack, 'EmailNotificationProvider');
      } else {
        this.logger.log('Email service is ready to send messages', 'EmailNotificationProvider');
      }
    });
  }

  validateRecipient(recipient: NotificationRecipient): boolean {
    return !!(recipient.email && this.isValidEmail(recipient.email));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async send(options: SendNotificationOptions): Promise<NotificationResult> {
    try {
      if (!this.validateRecipient(options.recipient)) {
        return {
          success: false,
          error: 'Invalid email recipient',
        };
      }

      const template = this.getTemplate(options.type, options.templateData);
      
      const mailOptions = {
        from: this.emailConfig.from,
        to: options.recipient.email!,
        subject: template.subject,
        html: template.htmlContent,
        text: template.content,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${options.recipient.email} with messageId: ${result.messageId}`, 'EmailNotificationProvider');
      
      return {
        success: true,
        messageId: result.messageId,
        metadata: {
          to: options.recipient.email,
          subject: template.subject,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.recipient.email}: ${error.message}`, error.stack, 'EmailNotificationProvider');
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getTemplate(type: NotificationType, templateData?: Record<string, any>) {
    switch (type) {
      case NotificationType.EMAIL_VERIFICATION:
        return this.getVerificationEmailTemplate(templateData);
      case NotificationType.WELCOME:
        return this.getWelcomeEmailTemplate(templateData);
      case NotificationType.APPOINTMENT_REMINDER:
        return this.getAppointmentReminderTemplate(templateData);
      default:
        throw new Error(`Unsupported email template type: ${type}`);
    }
  }

  private getVerificationEmailTemplate(data?: Record<string, any>) {
    const name = data?.patientName || 'Patient';
    const verificationUrl = data?.verificationUrl || '';
    
    return {
      subject: 'Verify your email address',
      content: `
        Hello ${name},

        Thank you for registering with our healthcare platform. 
        To complete your registration, please verify your email address by visiting this link:

        ${verificationUrl}

        If you didn't create an account with us, please ignore this email.
        This verification link will expire in 24 hours for security reasons.
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification</h1>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Hello ${name},
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Thank you for registering with our healthcare platform. To complete your registration, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #007bff; word-break: break-all;">
                ${verificationUrl}
              </a>
            </p>
          </div>
        </div>
      `,
    };
  }

  private getWelcomeEmailTemplate(data?: Record<string, any>) {
    const name = data?.patientName || 'Patient';
    
    return {
      subject: 'Welcome to Our Healthcare Platform',
      content: `Hello ${name}, welcome to our platform!`,
      htmlContent: `<h1>Hello ${name}, welcome to our platform!</h1>`,
    };
  }

  private getAppointmentReminderTemplate(data?: Record<string, any>) {
    const name = data?.patientName || 'Patient';
    const appointmentDate = data?.appointmentDate || 'your upcoming appointment';
    
    return {
      subject: 'Appointment Reminder',
      content: `Hello ${name}, this is a reminder about ${appointmentDate}.`,
      htmlContent: `<h1>Hello ${name}, this is a reminder about ${appointmentDate}.</h1>`,
    };
  }
}
