import { NextRequest, NextResponse } from 'next/server'

// Mock API endpoint for development
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== INTAKE SUBMISSION ===')
    console.log('Received intake data:', JSON.stringify(body, null, 2))
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock successful response
    const mockResponse = {
      id: `startup_${Date.now()}`,
      message: 'Intake submitted successfully!',
      status: 'success',
      data: body,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Intake submission successful:', mockResponse.id)
    
    return NextResponse.json(mockResponse, { status: 200 })
  } catch (error) {
    console.error('❌ Intake submission error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process intake submission',
        message: 'Please try again later',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// Handle updates to existing startups
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== INTAKE UPDATE ===')
    console.log('Updating intake data:', JSON.stringify(body, null, 2))
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const mockResponse = {
      id: 'existing_startup_id',
      message: 'Intake updated successfully!',
      status: 'updated',
      data: body,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Intake update successful')
    
    return NextResponse.json(mockResponse, { status: 200 })
  } catch (error) {
    console.error('❌ Intake update error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update intake',
        message: 'Please try again later',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// Get startup data
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Startups API endpoint',
    endpoints: {
      'POST /api/startups': 'Create new startup intake',
      'PUT /api/startups/:id': 'Update existing startup intake',
      'GET /api/startups': 'List startups (not implemented)',
    },
    timestamp: new Date().toISOString()
  })
}
