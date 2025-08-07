import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for OpenAI service
    const hasApiKey = !!process.env.OPENAI_API_KEY
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI service configuration check',
      data: {
        configured: hasApiKey,
        status: hasApiKey ? 'ready' : 'missing_api_key'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
