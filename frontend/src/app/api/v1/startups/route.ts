import { NextRequest, NextResponse } from 'next/server'

// Mock startups data for development
const mockStartups = [
  {
    id: '1',
    name: 'TechCorp',
    industry: 'Technology',
    stage: 'Seed',
    description: 'AI-powered solutions for modern businesses',
    targetAudience: 'Small to medium businesses',
    goals: ['brand-awareness', 'lead-generation'],
    brandVoice: 'professional',
    personalityTraits: ['innovative', 'trustworthy']
  },
  {
    id: '2',
    name: 'EcoStart',
    industry: 'Sustainability',
    stage: 'Series A',
    description: 'Green technology for a sustainable future',
    targetAudience: 'Environmentally conscious consumers',
    goals: ['brand-awareness', 'customer-retention'],
    brandVoice: 'friendly',
    personalityTraits: ['authentic', 'passionate']
  }
]

export async function GET(request: NextRequest) {
  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return NextResponse.json({
    success: true,
    data: mockStartups,
    total: mockStartups.length
  }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newStartup = {
      id: String(mockStartups.length + 1),
      ...body,
      createdAt: new Date().toISOString()
    }
    
    mockStartups.push(newStartup)
    
    return NextResponse.json({
      success: true,
      data: newStartup,
      message: 'Startup created successfully'
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create startup'
    }, { status: 400 })
  }
}
