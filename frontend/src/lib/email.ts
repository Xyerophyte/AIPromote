import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@aipromotehub.com'

export interface EmailTemplate {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export class EmailService {
  /**
   * Send a generic email
   */
  static async sendEmail(options: EmailTemplate) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        ...options,
      })

      if (error) {
        console.error('Email sending error:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Email service error:', error)
      throw error
    }
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to AI Promote Hub!'
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AI Promote Hub</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AI Promote Hub!</h1>
            <p style="color: #e0e6ff; margin: 10px 0 0 0; font-size: 16px;">Your AI-powered marketing journey starts here</p>
          </div>
          
          <div style="padding: 20px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p>Thank you for joining AI Promote Hub! We're excited to help you revolutionize your marketing strategy with the power of artificial intelligence.</p>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin: 0 0 15px 0;">What you can do with AI Promote Hub:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Generate engaging social media content</li>
                <li>Create compelling marketing campaigns</li>
                <li>Analyze your startup's unique value proposition</li>
                <li>Schedule and optimize your posts</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Get Started Now
              </a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team. We're here to help!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The AI Promote Hub Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; margin-top: 30px; color: #666; font-size: 14px;">
            <p>© 2024 AI Promote Hub. All rights reserved.</p>
          </div>
        </body>
      </html>
    `
    
    const text = `
      Welcome to AI Promote Hub!
      
      Hi ${name},
      
      Thank you for joining AI Promote Hub! We're excited to help you revolutionize your marketing strategy with the power of artificial intelligence.
      
      What you can do with AI Promote Hub:
      - Generate engaging social media content
      - Create compelling marketing campaigns
      - Analyze your startup's unique value proposition
      - Schedule and optimize your posts
      
      Get started: ${process.env.NEXTAUTH_URL}/dashboard
      
      If you have any questions, feel free to reach out to our support team.
      
      Best regards,
      The AI Promote Hub Team
    `

    return this.sendEmail({ to, subject, html, text })
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(to: string, token: string, name?: string) {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
    
    const subject = 'Verify your email address'
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 40px 20px;">
            <h1 style="color: #667eea; margin-bottom: 10px;">Verify Your Email</h1>
            <p style="color: #666; font-size: 16px;">Please verify your email address to complete your registration</p>
          </div>
          
          <div style="padding: 20px;">
            ${name ? `<p>Hi ${name},</p>` : ''}
            
            <p>Thanks for signing up for AI Promote Hub! To complete your registration and start using your account, please verify your email address by clicking the button below.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px;">${verificationUrl}</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `
    
    const text = `
      Verify Your Email
      
      ${name ? `Hi ${name},` : ''}
      
      Thanks for signing up for AI Promote Hub! To complete your registration, please verify your email address by visiting:
      
      ${verificationUrl}
      
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    `

    return this.sendEmail({ to, subject, html, text })
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(to: string, token: string, name?: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
    
    const subject = 'Reset your password'
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 40px 20px;">
            <h1 style="color: #667eea; margin-bottom: 10px;">Reset Your Password</h1>
            <p style="color: #666; font-size: 16px;">We received a request to reset your password</p>
          </div>
          
          <div style="padding: 20px;">
            ${name ? `<p>Hi ${name},</p>` : ''}
            
            <p>We received a request to reset the password for your AI Promote Hub account. If you made this request, click the button below to reset your password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px;">${resetUrl}</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const text = `
      Reset Your Password
      
      ${name ? `Hi ${name},` : ''}
      
      We received a request to reset the password for your AI Promote Hub account. If you made this request, visit the following link to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
    `

    return this.sendEmail({ to, subject, html, text })
  }

  /**
   * Send notification email
   */
  static async sendNotification(to: string, title: string, message: string, actionUrl?: string, actionText?: string) {
    const subject = title
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="padding: 20px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">${title}</h2>
            <p>${message}</p>
            
            ${actionUrl && actionText ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                ${actionText}
              </a>
            </div>
            ` : ''}
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The AI Promote Hub Team</strong>
            </p>
          </div>
        </body>
      </html>
    `
    
    const text = `
      ${title}
      
      ${message}
      
      ${actionUrl && actionText ? `${actionText}: ${actionUrl}` : ''}
      
      Best regards,
      The AI Promote Hub Team
    `

    return this.sendEmail({ to, subject, html, text })
  }
}
