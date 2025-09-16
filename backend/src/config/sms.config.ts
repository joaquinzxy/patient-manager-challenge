export interface SmsConfig {
  provider: 'twilio' | 'aws-sns' | 'vonage';
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
  enabled: boolean;
}

export default (): { sms: SmsConfig } => ({
  sms: {
    provider: (process.env.SMS_PROVIDER as 'twilio' | 'aws-sns' | 'vonage') || 'twilio',
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || '',
    fromNumber: process.env.SMS_FROM_NUMBER || '',
    enabled: process.env.SMS_ENABLED === 'true',
  },
});
