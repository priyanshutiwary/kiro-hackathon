import { Resend } from 'resend';

// Lazy initialization of Resend client
let resend: Resend | null = null;

const getResendClient = (): Resend => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

// Rate limiting storage for email sending
const emailRateLimit = new Map<string, { count: number; resetTime: number }>();

// Email template types
export type EmailTemplate = 'verify-email' | 'reset-password' | 'welcome';

// Email template data interfaces
export interface EmailTemplateData {
  'verify-email': {
    email: string;
    verificationUrl: string;
    appName: string;
  };
  'reset-password': {
    email: string;
    resetUrl: string;
    appName: string;
    expiresIn: string;
  };
  'welcome': {
    name: string;
    email: string;
    dashboardUrl: string;
  };
}

// Email service interface
export interface EmailService {
  sendEmail<T extends EmailTemplate>(params: {
    to: string;
    subject: string;
    template: T;
    data: EmailTemplateData[T];
  }): Promise<void>;
  
  sendVerificationEmail(email: string, verificationUrl: string): Promise<void>;
  sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string, dashboardUrl: string): Promise<void>;
  checkRateLimit(email: string, type: 'verification' | 'reset'): Promise<boolean>;
}

// Rate limiting function
const checkEmailRateLimit = (email: string, type: 'verification' | 'reset'): boolean => {
  const key = `${email}:${type}`;
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
  
  const current = emailRateLimit.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize rate limit
    emailRateLimit.set(key, { count: 1, resetTime: now + hourInMs });
    return true;
  }
  
  if (current.count >= 3) {
    // Rate limit exceeded (3 emails per hour per type)
    return false;
  }
  
  // Increment count
  current.count++;
  emailRateLimit.set(key, current);
  return true;
};

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  emailRateLimit.forEach((value, key) => {
    if (now > value.resetTime) {
      emailRateLimit.delete(key);
    }
  });
}, 60 * 60 * 1000); // Clean up every hour

// Email template generators
const generateEmailTemplate = <T extends EmailTemplate>(
  template: T,
  data: EmailTemplateData[T]
): string => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'InvoCall';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invocall.com';
  
  switch (template) {
    case 'verify-email':
      const verifyData = data as EmailTemplateData['verify-email'];
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - ${appName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${appName}</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email Address</h2>
            <p>Hi there!</p>
            <p>Thanks for signing up for ${appName}. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyData.verificationUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verifyData.verificationUrl}</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              This verification link will expire in 24 hours. If you didn't create an account with ${appName}, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 14px; color: #6b7280;">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p><a href="${appUrl}" style="color: #2563eb;">Visit our website</a></p>
          </div>
        </body>
        </html>
      `;
      
    case 'reset-password':
      const resetData = data as EmailTemplateData['reset-password'];
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - ${appName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${appName}</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
            <p>Hi there!</p>
            <p>We received a request to reset your password for your ${appName} account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetData.resetUrl}" 
                 style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetData.resetUrl}</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              This password reset link will expire in ${resetData.expiresIn}. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 14px; color: #6b7280;">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p><a href="${appUrl}" style="color: #2563eb;">Visit our website</a></p>
          </div>
        </body>
        </html>
      `;
      
    case 'welcome':
      const welcomeData = data as EmailTemplateData['welcome'];
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${appName}!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${appName}</h1>
          </div>
          
          <div style="background: #f0fdf4; padding: 30px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #22c55e;">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome to ${appName}!</h2>
            <p>Hi ${welcomeData.name}!</p>
            <p>Welcome to ${appName}! We're excited to have you on board. Your account has been successfully created and verified.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${welcomeData.dashboardUrl}" 
                 style="background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
            
            <p>Here's what you can do next:</p>
            <ul style="color: #374151;">
              <li>Set up your business profile</li>
              <li>Connect your Zoho Books integration</li>
              <li>Configure your payment reminder settings</li>
              <li>Start managing your invoices and customers</li>
            </ul>
            
            <p style="margin-top: 30px;">
              If you have any questions or need help getting started, don't hesitate to reach out to our support team.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 14px; color: #6b7280;">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p><a href="${appUrl}" style="color: #2563eb;">Visit our website</a></p>
          </div>
        </body>
        </html>
      `;
      
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
};

// Email service implementation
export const emailService: EmailService = {
  async sendEmail<T extends EmailTemplate>({
    to,
    subject,
    template,
    data,
  }: {
    to: string;
    subject: string;
    template: T;
    data: EmailTemplateData[T];
  }): Promise<void> {
    try {
      // Validate Resend API key
      if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY environment variable is not set');
        throw new Error('Email service is not configured. Please contact support.');
      }

      // Generate email HTML content
      const html = generateEmailTemplate(template, data);
      
      // Send email via Resend with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timeout')), 30000); // 30 second timeout
      });
      
      const sendPromise = getResendClient().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'InvoCall <noreply@invocall.com>',
        to,
        subject,
        html,
      });

      const result = await Promise.race([sendPromise, timeoutPromise]) as { data?: { id?: string }; error?: { message?: string } };

      if (result.error) {
        console.error('❌ Resend email error:', result.error);
        throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`);
      }

      console.log(`✅ Email sent successfully to ${to} with template ${template} (ID: ${result.data?.id || 'unknown'})`);
    } catch (error) {
      console.error('❌ Email service error:', error);
      
      // Provide user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Email sending is taking longer than expected. Please try again in a few minutes.');
        } else if (error.message.includes('API key')) {
          throw new Error('Email service is temporarily unavailable. Please contact support.');
        }
      }
      
      throw error;
    }
  },

  async checkRateLimit(email: string, type: 'verification' | 'reset'): Promise<boolean> {
    return checkEmailRateLimit(email, type);
  },

  async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
    // Check rate limit before sending
    if (!checkEmailRateLimit(email, 'verification')) {
      const error = new Error('Too many verification emails sent. Please wait an hour before requesting another.');
      console.warn(`⚠️ Rate limit exceeded for verification email to: ${email}`);
      throw error;
    }

    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'InvoCall';
    
    try {
      await this.sendEmail({
        to: email,
        subject: `Verify your email address - ${appName}`,
        template: 'verify-email',
        data: {
          email,
          verificationUrl,
          appName,
        },
      });
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}:`, error);
      throw error;
    }
  },

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    // Check rate limit before sending
    if (!checkEmailRateLimit(email, 'reset')) {
      const error = new Error('Too many password reset emails sent. Please wait an hour before requesting another.');
      console.warn(`⚠️ Rate limit exceeded for password reset email to: ${email}`);
      throw error;
    }

    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'InvoCall';
    
    try {
      await this.sendEmail({
        to: email,
        subject: `Reset your password - ${appName}`,
        template: 'reset-password',
        data: {
          email,
          resetUrl,
          appName,
          expiresIn: '1 hour',
        },
      });
    } catch (error) {
      console.error(`❌ Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  },

  async sendWelcomeEmail(email: string, name: string, dashboardUrl: string): Promise<void> {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'InvoCall';
    
    try {
      await this.sendEmail({
        to: email,
        subject: `Welcome to ${appName}!`,
        template: 'welcome',
        data: {
          name,
          email,
          dashboardUrl,
        },
      });
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error);
      // Don't throw error for welcome emails as they're not critical
    }
  },
};

// Utility function to validate email configuration on startup
export const validateEmailConfiguration = (): void => {
  try {
    const requiredEnvVars = [
      'RESEND_API_KEY',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables for email service:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate Resend API key format
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && !apiKey.startsWith('re_')) {
      console.warn('⚠️ RESEND_API_KEY does not appear to be in the correct format (should start with "re_")');
    }

    // Validate from email format
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (fromEmail && !fromEmail.includes('@')) {
      console.warn('⚠️ RESEND_FROM_EMAIL does not appear to be a valid email address');
    }

    console.log('✅ Email service configuration validated successfully');
    console.log(`📧 Email service configured with from address: ${fromEmail || 'InvoCall <noreply@invocall.com>'}`);
  } catch (error) {
    console.error('❌ Email service configuration validation failed:', error);
    throw error;
  }
};

// Export default email service instance
export default emailService;