import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get session for user context (optional)
    const session = await auth()
    
    const errorData = await request.json()
    
    // Validate error data
    const {
      message,
      stack,
      componentStack,
      userAgent,
      url,
      timestamp
    } = errorData
    
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Error message is required' },
        { status: 400 }
      )
    }
    
    // Log to Supabase (create an errors table first)
    const { error } = await supabaseAdmin
      .from('error_logs')
      .insert({
        user_id: session?.user?.id || null,
        message,
        stack,
        component_stack: componentStack,
        user_agent: userAgent,
        url,
        timestamp,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to log error to Supabase:', error)
      // Don't fail the request if logging fails
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Frontend Error Logged:', {
        user: session?.user?.email,
        message,
        stack,
        url,
        timestamp
      })
    }
    
    return NextResponse.json(
      { success: true, message: 'Error logged successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error logging endpoint failed:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    )
  }
}
