export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push', // For future use
}

export enum NotificationType {
  EMAIL_VERIFICATION = 'email_verification',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  SYSTEM_ALERT = 'system_alert',
  WELCOME = 'welcome',
}

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  userId?: string;
  name?: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string; // For email
  content: string;
  htmlContent?: string; // For email
}

export interface SendNotificationOptions {
  channel: NotificationChannel;
  type: NotificationType;
  recipient: NotificationRecipient;
  templateData?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(options: SendNotificationOptions): Promise<NotificationResult>;
  validateRecipient(recipient: NotificationRecipient): boolean;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}
