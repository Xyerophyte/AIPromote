import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for Stripe service
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
    
    return NextResponse.json({
      success: true,
      message: 'Stripe service configuration check',
      data: {
        secret_key_configured: hasSecretKey,
        webhook_secret_configured: hasWebhookSecret,
        status: hasSecretKey ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
