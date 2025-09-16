export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateName?: string;
  templateData?: Record<string, any>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}