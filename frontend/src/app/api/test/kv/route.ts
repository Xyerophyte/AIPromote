import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for KV service
    const hasKvToken = !!process.env.KV_REST_API_TOKEN
    const hasKvUrl = !!process.env.KV_REST_API_URL
    
    return NextResponse.json({
      success: true,
      message: 'Vercel KV configuration check',
      data: {
        kv_token_configured: hasKvToken,
        kv_url_configured: hasKvUrl,
        status: hasKvToken && hasKvUrl ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
