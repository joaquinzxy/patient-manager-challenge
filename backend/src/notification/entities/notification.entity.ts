import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { NotificationChannel, NotificationType } from '../interfaces/notification.interface';

export enum NotificationStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
  })
  status: NotificationStatus;

  @Column()
  recipientEmail: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column({ nullable: true })
  recipientName: string;

  @Column({ nullable: true })
  subject: string; // For email notifications

  @Column('text')
  content: string;

  @Column({ nullable: true })
  errorMessage: string; // If failed, what was the error

  @CreateDateColumn()
  createdAt: Date;
}
