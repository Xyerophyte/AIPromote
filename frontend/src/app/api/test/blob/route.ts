import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for Blob service
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
    
    return NextResponse.json({
      success: true,
      message: 'Vercel Blob configuration check',
      data: {
        blob_configured: hasToken,
        status: hasToken ? 'ready' : 'missing_token'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
