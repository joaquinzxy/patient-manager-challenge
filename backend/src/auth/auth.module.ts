import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerificationService } from './email-verification-token.service';
import { AuthController } from './email-verification-token.controller';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { Patient } from '../patient/entities/patient.entity';
import { NotificationModule } from '../notification/notification.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerificationToken, Patient]),
    NotificationModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class AuthModule {}
