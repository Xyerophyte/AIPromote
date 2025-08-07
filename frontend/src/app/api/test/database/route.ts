import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for database
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return NextResponse.json({
      success: true,
      message: 'Database configuration check',
      data: {
        database_url_configured: hasDatabaseUrl,
        supabase_url_configured: hasSupabaseUrl,
        supabase_key_configured: hasSupabaseKey,
        status: hasDatabaseUrl && hasSupabaseUrl && hasSupabaseKey ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
