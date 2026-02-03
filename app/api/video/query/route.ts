import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('id')
    const apiKey = searchParams.get('apiKey')
    const apiBaseUrl = searchParams.get('apiBaseUrl')

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
    }

    const baseUrl = apiBaseUrl || 'https://yunwu.ai'

    // Query the Veo API
    const response = await fetch(`${baseUrl}/v1/video/query?id=${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Update database if status changed
    if (data.status === 'completed' || data.status === 'failed' || data.video_url) {
      const supabase = await createClient()
      await supabase
        .from('video_generations')
        .update({
          status: data.video_url ? 'completed' : data.status,
          video_url: data.video_url,
          enhanced_prompt: data.enhanced_prompt,
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', taskId)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Query video error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query video' },
      { status: 500 }
    )
  }
}
