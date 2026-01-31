/**
 * Email Service
 * 
 * Handles sending emails using SMTP configuration from system settings
 */

import nodemailer from 'nodemailer';
import settingsService from './settingsService';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create transporter using SMTP settings from database
 */
const createTransporter = async () => {
  const emailConfig = await settingsService.getEmailConfig();
  
  if (!emailConfig.host || !emailConfig.user) {
    throw new Error('Email settings not configured. Please configure SMTP settings in admin panel.');
  }

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.port === 465, // true for 465, false for other ports
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });
};

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = await createTransporter();
    const emailConfig = await settingsService.getEmailConfig();
    
    const info = await transporter.sendMail({
      from: `"${await settingsService.getSetting('smtp_from_name', 'RitoMovie')}" <${emailConfig.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('[EmailService] Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    throw new Error('Failed to send email. Please check SMTP settings.');
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<void> => {
  const siteName = await settingsService.getSetting<string>('site_name', 'RitoMovie');
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${siteName}</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in <strong>1 hour</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you create a new one</li>
            </ul>
          </div>
          
          <p>Need help? Contact us at ${await settingsService.getSetting('contact_email', 'support@ritomovie.live')}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${userName}!
    
    We received a request to reset your password.
    
    Click this link to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this, please ignore this email.
    
    - ${siteName} Team
  `;

  await sendEmail({
    to: email,
    subject: `Reset Your ${siteName} Password`,
    html,
    text,
  });
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (
  email: string,
  verificationToken: string,
  userName: string
): Promise<void> => {
  const siteName = await settingsService.getSetting<string>('site_name', 'RitoMovie');
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .welcome { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${siteName}!</h1>
          <p>🎬 Your Movie Streaming Platform</p>
        </div>
        <div class="content">
          <div class="welcome">
            <h2>Hello ${userName}! 👋</h2>
            <p>Thank you for joining ${siteName}! We're excited to have you.</p>
          </div>
          
          <p>To get started and access all features, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
          
          <p><strong>What's next?</strong></p>
          <ul>
            <li>Browse thousands of movies and TV shows</li>
            <li>Create your personal watchlist</li>
            <li>Rate and comment on your favorites</li>
            <li>Get personalized recommendations</li>
          </ul>
          
          <p>This verification link will expire in <strong>24 hours</strong>.</p>
          
          <p>Need help? Contact us at ${await settingsService.getSetting('contact_email', 'support@ritomovie.live')}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to ${siteName}!
    
    Hello ${userName}!
    
    Thank you for joining us. Please verify your email address by clicking this link:
    ${verifyUrl}
    
    This link will expire in 24 hours.
    
    - ${siteName} Team
  `;

  await sendEmail({
    to: email,
    subject: `Verify Your ${siteName} Account`,
    html,
    text,
  });
};

/**
 * Send welcome email (after verification)
 */
export const sendWelcomeEmail = async (
  email: string,
  userName: string
): Promise<void> => {
  const siteName = await settingsService.getSetting<string>('site_name', 'RitoMovie');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You're All Set!</h1>
          <p>${siteName}</p>
        </div>
        <div class="content">
          <h2>Welcome aboard, ${userName}!</h2>
          <p>Your email has been verified successfully. You now have full access to all features!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Start Watching</a>
          </div>
          
          <h3>Here's what you can do now:</h3>
          
          <div class="feature">
            <strong>🎬 Browse Movies & TV Shows</strong>
            <p>Discover thousands of titles across all genres</p>
          </div>
          
          <div class="feature">
            <strong>⭐ Rate & Review</strong>
            <p>Share your thoughts and help others find great content</p>
          </div>
          
          <div class="feature">
            <strong>📝 Create Watchlists</strong>
            <p>Save movies to watch later and never lose track</p>
          </div>
          
          <div class="feature">
            <strong>💬 Join Discussions</strong>
            <p>Comment and connect with other movie lovers</p>
          </div>
          
          <p>Happy watching! 🍿</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to ${siteName}!
    
    Your email has been verified successfully, ${userName}!
    
    You now have full access to:
    - Browse movies and TV shows
    - Rate and review content
    - Create watchlists
    - Join discussions
    
    Start watching: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
    
    - ${siteName} Team
  `;

  await sendEmail({
    to: email,
    subject: `Welcome to ${siteName}! 🎉`,
    html,
    text,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
};
