import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildApiEndpoint, createApiHeaders, handleApiResponse } from '@/lib/api-utils'
import type { QueryVideoResponse } from '@/lib/types'

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

    const apiEndpoint = buildApiEndpoint(apiBaseUrl || '', `/video/query?id=${encodeURIComponent(taskId)}`)
    console.log('[QUERY] Querying task:', taskId)

    // Query the Veo API
    let response: Response
    try {
      response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: createApiHeaders(apiKey),
      })
    } catch (fetchError) {
      console.error('[QUERY] Network error:', fetchError)
      return NextResponse.json(
        { error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to API'}` },
        { status: 500 }
      )
    }

    const data = await handleApiResponse<QueryVideoResponse>(response)
    console.log('[QUERY] Task status:', data.status, data.video_url ? 'has video URL' : 'no video URL')

    // Update database if status changed or video is ready
    if (data.status === 'completed' || data.status === 'failed' || data.video_url) {
      try {
        const supabase = await createClient()
        await supabase
          .from('video_generations')
          .update({
            status: data.video_url ? 'completed' : data.status,
            video_url: data.video_url || null,
            enhanced_prompt: data.enhanced_prompt || null,
            updated_at: new Date().toISOString(),
          })
          .eq('task_id', taskId)
      } catch (dbErr) {
        console.error('[QUERY] Database error:', dbErr)
        // Don't fail the request if database update fails
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[QUERY] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to query video'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
