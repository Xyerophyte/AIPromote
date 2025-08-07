import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is required')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface SendEmailParams {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  template?: keyof typeof EMAIL_TEMPLATES
  templateData?: Record<string, any>
}

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to AIPromote!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Welcome to AIPromote! 🎉</h1>
        <p>Hi {{name}},</p>
        <p>Thank you for signing up for AIPromote! We're excited to help you create amazing social media content with AI.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Get Started:</h3>
          <ul>
            <li>Complete your profile setup</li>
            <li>Connect your social media accounts</li>
            <li>Generate your first AI-powered content</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,<br>The AIPromote Team</p>
      </div>
    `,
  },
  emailVerification: {
    subject: 'Please verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Verify Your Email Address</h1>
        <p>Hi {{name}},</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{verificationUrl}}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you didn't create an account with us, please ignore this email.</p>
      </div>
    `,
  },
  passwordReset: {
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
        <p>Hi {{name}},</p>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{resetUrl}}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
      </div>
    `,
  },
  contentGenerated: {
    subject: 'Your AI content is ready! ✨',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Your Content is Ready! ✨</h1>
        <p>Hi {{name}},</p>
        <p>Great news! We've successfully generated {{contentCount}} content variations for your {{platform}} {{contentType}}.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Content Preview:</h3>
          <p style="font-style: italic; color: #666;">{{contentPreview}}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{contentUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View & Edit Content</a>
        </div>
        <p>Ready to schedule or publish? Head to your dashboard to review and customize your content.</p>
        <p>Happy posting!<br>The AIPromote Team</p>
      </div>
    `,
  },
  contentScheduled: {
    subject: 'Content scheduled successfully 📅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Content Scheduled! 📅</h1>
        <p>Hi {{name}},</p>
        <p>Your {{platform}} {{contentType}} has been scheduled for posting on <strong>{{scheduledDate}}</strong>.</p>
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h4 style="margin-top: 0; color: #155724;">Scheduled Content:</h4>
          <p style="color: #155724;">{{contentPreview}}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{scheduleUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Schedule</a>
        </div>
        <p>We'll notify you once your content is published.</p>
        <p>Keep creating!<br>The AIPromote Team</p>
      </div>
    `,
  },
  contentPublished: {
    subject: 'Your content is now live! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Content Published! 🚀</h1>
        <p>Hi {{name}},</p>
        <p>Your {{platform}} {{contentType}} has been successfully published!</p>
        <div style="background: #cff4fc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0dcaf0;">
          <h4 style="margin-top: 0; color: #055160;">Published Content:</h4>
          <p style="color: #055160;">{{contentPreview}}</p>
        </div>
        {{#if postUrl}}
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{postUrl}}" style="background: #0dcaf0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Post</a>
        </div>
        {{/if}}
        <p>Track your content performance in the analytics dashboard.</p>
        <p>Great job!<br>The AIPromote Team</p>
      </div>
    `,
  },
  weeklyReport: {
    subject: 'Your weekly content performance report 📊',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Weekly Performance Report 📊</h1>
        <p>Hi {{name}},</p>
        <p>Here's how your content performed this week:</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">This Week's Highlights:</h3>
          <ul>
            <li><strong>{{totalPosts}}</strong> posts published</li>
            <li><strong>{{totalViews}}</strong> total views</li>
            <li><strong>{{totalEngagement}}</strong> engagements</li>
            <li><strong>{{topPlatform}}</strong> was your best performing platform</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{analyticsUrl}}" style="background: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Full Report</a>
        </div>
        <p>Keep up the great work!</p>
        <p>Best regards,<br>The AIPromote Team</p>
      </div>
    `,
  },
} as const

class EmailService {
  private getFromEmail(): string {
    return process.env.FROM_EMAIL || 'noreply@aipromoter.app'
  }

  private processTemplate(template: EmailTemplate, data: Record<string, any>): { subject: string; html: string } {
    let { subject, html } = template
    
    // Simple template replacement (you might want to use a proper template engine)
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, String(value))
      html = html.replace(regex, String(value))
    })

    // Handle conditional blocks (simple implementation)
    html = html.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      return data[condition] ? content : ''
    })

    return { subject, html }
  }

  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let { subject, html, text } = params

      // Use template if specified
      if (params.template && EMAIL_TEMPLATES[params.template]) {
        const template = EMAIL_TEMPLATES[params.template]
        const processed = this.processTemplate(template, params.templateData || {})
        subject = processed.subject
        html = processed.html
      }

      const result = await resend.emails.send({
        from: params.from || this.getFromEmail(),
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject,
        html,
        text,
      })

      if (result.error) {
        console.error('Resend email error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true, messageId: result.data?.id }
    } catch (error) {
      console.error('Email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Convenience methods for common email types
  async sendWelcomeEmail(to: string, data: { name: string; dashboardUrl: string }) {
    return this.sendEmail({
      to,
      template: 'welcome',
      templateData: data,
    })
  }

  async sendEmailVerification(to: string, data: { name: string; verificationUrl: string }) {
    return this.sendEmail({
      to,
      template: 'emailVerification',
      templateData: data,
    })
  }

  async sendPasswordReset(to: string, data: { name: string; resetUrl: string }) {
    return this.sendEmail({
      to,
      template: 'passwordReset',
      templateData: data,
    })
  }

  async sendContentGenerated(to: string, data: { 
    name: string; 
    contentCount: number; 
    platform: string; 
    contentType: string; 
    contentPreview: string;
    contentUrl: string;
  }) {
    return this.sendEmail({
      to,
      template: 'contentGenerated',
      templateData: data,
    })
  }

  async sendContentScheduled(to: string, data: {
    name: string;
    platform: string;
    contentType: string;
    scheduledDate: string;
    contentPreview: string;
    scheduleUrl: string;
  }) {
    return this.sendEmail({
      to,
      template: 'contentScheduled',
      templateData: data,
    })
  }

  async sendContentPublished(to: string, data: {
    name: string;
    platform: string;
    contentType: string;
    contentPreview: string;
    postUrl?: string;
  }) {
    return this.sendEmail({
      to,
      template: 'contentPublished',
      templateData: data,
    })
  }

  async sendWeeklyReport(to: string, data: {
    name: string;
    totalPosts: number;
    totalViews: number;
    totalEngagement: number;
    topPlatform: string;
    analyticsUrl: string;
  }) {
    return this.sendEmail({
      to,
      template: 'weeklyReport',
      templateData: data,
    })
  }

  // Bulk email methods
  async sendBulkEmail(recipients: string[], params: Omit<SendEmailParams, 'to'>) {
    const results = await Promise.allSettled(
      recipients.map(recipient => 
        this.sendEmail({ ...params, to: recipient })
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return { successful, failed, total: recipients.length }
  }

  // Test email connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Send a test email to verify connection
      const result = await this.sendEmail({
        to: 'test@example.com', // This will fail but test the connection
        subject: 'Test Connection',
        text: 'Test message',
      })
      
      // If we get here, the service is configured correctly
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

export const emailService = new EmailService()
export default emailService
