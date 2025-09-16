import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Patient } from '../patient/entities/patient.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { LoggerService } from '../common/logger/logger.service';
import * as crypto from 'crypto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private tokenRepo: Repository<EmailVerificationToken>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    private notificationService: NotificationService,
    private readonly logger: LoggerService,
  ) {}

  async generateVerificationToken(patientId: string): Promise<string> {
    this.logger.log(`Generating verification token for patient: ${patientId}`, 'EmailVerificationService');
    
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const tokenString = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .where('patientId = :patientId AND usedAt IS NULL', { patientId })
      .execute();

    const token = this.tokenRepo.create({ 
      patient, 
      token: tokenString,
      expiresAt,
      patientId,
    });
    
    await this.tokenRepo.save(token);
    this.logger.log(`Verification token generated successfully for patient: ${patientId}`, 'EmailVerificationService');
    return token.token;
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Verifying email with token: ${token.substring(0, 8)}...`, 'EmailVerificationService');
    
    const verificationToken = await this.tokenRepo.findOne({ 
      where: { token },
      relations: ['patient'],
    });
    
    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException('Verification token has already been used');
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new BadRequestException('Verification token has expired');
    }

    verificationToken.usedAt = new Date();
    await this.tokenRepo.save(verificationToken);

    const patient = verificationToken.patient;
    patient.isEmailVerified = true;
    await this.patientRepo.save(patient);

    this.logger.log(`Email verified successfully for patient: ${patient.id}`, 'EmailVerificationService');

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    this.logger.log(`Resending verification for email: ${email}`, 'EmailVerificationService');
    
    const patient = await this.patientRepo.findOne({ 
      where: { email: email.toLowerCase().trim(), isDeleted: false } 
    });
    
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const token = await this.generateVerificationToken(patient.id);
    
    await this.notificationService.sendVerificationNotification(
      patient.email, 
      token, 
      patient.name,
      patient.phoneNumber
    );

    this.logger.log(`Verification notification resent successfully for email: ${email}`, 'EmailVerificationService');

    return {
      message: 'Verification notification sent successfully',
    };
  }

  async sendInitialVerification(patientId: string): Promise<{ message: string }> {
    this.logger.log(`Sending initial verification for patient: ${patientId}`, 'EmailVerificationService');
    
    const patient = await this.patientRepo.findOne({ 
      where: { id: patientId, isDeleted: false } 
    });
    
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isEmailVerified) {
      this.logger.warn(`Patient ${patientId} email is already verified`, 'EmailVerificationService');
      return { message: 'Email is already verified' };
    }

    const token = await this.generateVerificationToken(patient.id);
    
    await this.notificationService.sendVerificationNotification(
      patient.email, 
      token, 
      patient.name,
      patient.phoneNumber
    );

    this.logger.log(`Initial verification notification sent successfully for patient: ${patientId}`, 'EmailVerificationService');

    return {
      message: 'Verification notification sent successfully',
    };
  }

  async cleanupExpiredTokens(): Promise<void> {
    this.logger.debug('Cleaning up expired verification tokens', 'EmailVerificationService');
    
    await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
      
    this.logger.debug('Expired verification tokens cleaned up', 'EmailVerificationService');
  }
}