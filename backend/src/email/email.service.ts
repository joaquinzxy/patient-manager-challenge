import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailOptions, EmailTemplate } from './interfaces/email.interface';
import { EmailConfig } from 'src/config/email.config';
import { LoggerService } from '../common/logger/logger.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
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
        this.logger.error(`Email service connection failed: ${error.message}`, error.stack, 'EmailService');
      } else {
        this.logger.log('Email service is ready to send messages', 'EmailService');
      }
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.emailConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.logWithMetadata('info', 'Email configuration', mailOptions, 'EmailService');
      this.logger.logWithMetadata('info', 'Email sent details', result, 'EmailService');
      this.logger.log(`Email sent successfully to ${options.to} with messageId: ${result.messageId}`, 'EmailService');
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`, error.stack, 'EmailService');
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string, patientName?: string): Promise<boolean> {
    this.logger.log(`Sending verification email to: ${email}`, 'EmailService');
    
    const verificationUrl = `${process.env.BASE_URL}/${process.env.API_PREFIX}/${process.env.API_VERSION}/auth/verify-email?token=${token}`;

    // Log url for debugging
    this.logger.debug(`Verification URL for ${email}: ${verificationUrl}`, 'EmailService');
    
    const template = this.getVerificationEmailTemplate(patientName, verificationUrl);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

    private getVerificationEmailTemplate(patientName?: string, verificationUrl?: string): EmailTemplate {
    const name = patientName || 'Patient';
    
    return {
      subject: 'Verify your email address',
      html: `
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
      text: `
        Hello ${name},

        Thank you for registering with our healthcare platform. 
        To complete your registration, please verify your email address by visiting this link:

        ${verificationUrl}

        If you didn't create an account with us, please ignore this email.
        This verification link will expire in 24 hours for security reasons.
      `,
    };
  }
}