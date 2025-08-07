import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for email service
    const hasApiKey = !!process.env.RESEND_API_KEY
    const hasFromEmail = !!process.env.FROM_EMAIL
    
    return NextResponse.json({
      success: true,
      message: 'Email service configuration check',
      data: {
        resend_configured: hasApiKey,
        from_email_configured: hasFromEmail,
        status: hasApiKey && hasFromEmail ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
