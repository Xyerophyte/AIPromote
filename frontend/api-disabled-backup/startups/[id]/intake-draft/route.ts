import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for development (use database in production)
const drafts = new Map<string, any>()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const startupId = params.id
    const draftData = await request.json()
    
    console.log(`=== SAVING DRAFT for ${startupId} ===`)
    console.log('Draft data:', JSON.stringify(draftData, null, 2))
    
    // Save to in-memory storage
    drafts.set(startupId, {
      ...draftData,
      savedAt: new Date().toISOString(),
      id: startupId
    })
    
    console.log(`✅ Draft saved for startup ${startupId}`)
    
    return NextResponse.json({
      message: 'Draft saved successfully',
      id: startupId,
      savedAt: new Date().toISOString()
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Failed to save draft:', error)
    
    return NextResponse.json({
      error: 'Failed to save draft',
      message: 'Please try again later'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const startupId = params.id
    
    console.log(`=== LOADING DRAFT for ${startupId} ===`)
    
    const draft = drafts.get(startupId)
    
    if (!draft) {
      console.log(`No draft found for startup ${startupId}`)
      return NextResponse.json({
        message: 'No draft found',
        id: startupId
      }, { status: 404 })
    }
    
    console.log(`✅ Draft loaded for startup ${startupId}`)
    
    return NextResponse.json(draft, { status: 200 })
    
  } catch (error) {
    console.error('❌ Failed to load draft:', error)
    
    return NextResponse.json({
      error: 'Failed to load draft',
      message: 'Please try again later'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const startupId = params.id
    
    console.log(`=== DELETING DRAFT for ${startupId} ===`)
    
    const existed = drafts.delete(startupId)
    
    if (!existed) {
      return NextResponse.json({
        message: 'Draft not found',
        id: startupId
      }, { status: 404 })
    }
    
    console.log(`✅ Draft deleted for startup ${startupId}`)
    
    return NextResponse.json({
      message: 'Draft deleted successfully',
      id: startupId
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Failed to delete draft:', error)
    
    return NextResponse.json({
      error: 'Failed to delete draft',
      message: 'Please try again later'
    }, { status: 500 })
  }
}
