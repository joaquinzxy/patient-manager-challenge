import { IsEnum, IsOptional, IsString, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel, NotificationType } from '../interfaces/notification.interface';

export class NotificationRecipientDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateNotificationDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsEnum(NotificationType)
  type: NotificationType;

  @ValidateNested()
  @Type(() => NotificationRecipientDto)
  recipient: NotificationRecipientDto;

  @IsOptional()
  templateData?: Record<string, any>;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high';

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
