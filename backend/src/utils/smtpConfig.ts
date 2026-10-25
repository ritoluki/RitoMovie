import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import ApiError from './ApiError';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}
export const smtpOptions = (config: EmailConfig): SMTPTransport.Options => {
  if (!config.host?.trim() || !config.user?.trim() || !config.password) {
    throw new ApiError(
      400,
      'Save SMTP Host, Username and Password in Admin → Settings → Email first.'
    );
  }
  if (
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535
  ) {
    throw new ApiError(400, 'SMTP Port must be a number between 1 and 65535.');
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.from || '')) {
    throw new ApiError(400, 'Configure a valid From Email address.');
  }
  return {
    host: config.host.trim(),
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: { user: config.user.trim(), pass: config.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };
};

export const smtpErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code;
  if (code === 'EAUTH')
    return 'SMTP authentication failed. Check the username and app password or API key.';
  if (['ECONNECTION', 'ESOCKET', 'ETIMEDOUT', 'EDNS'].includes(code))
    return 'Cannot connect to SMTP. Check the host, port and network connection.';
  if (code === 'EENVELOPE')
    return 'SMTP rejected the sender or recipient. Check From Email and the recipient address.';
  return 'SMTP did not accept the email. Check the saved SMTP configuration.';
};

export const verificationLink = (base: string, token: string) =>
  `${base.replace(/\/+$/, '')}/verify-email/${encodeURIComponent(token)}`;
export const resetPasswordLink = (base: string, token: string) =>
  `${base.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
