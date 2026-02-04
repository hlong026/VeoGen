import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('id')
    const apiKey = searchParams.get('apiKey')
    const apiBaseUrl = searchParams.get('apiBaseUrl')

    console.log('[QUERY] 查询任务:', taskId)

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
    }

    const baseUrl = (apiBaseUrl || 'https://api.mooerai.xyz').replace(/\/+$/, '')
    // 检查 baseUrl 是否已包含 /v1
    const apiEndpoint = baseUrl.endsWith('/v1')
      ? `${baseUrl}/video/query?id=${encodeURIComponent(taskId)}`
      : `${baseUrl}/v1/video/query?id=${encodeURIComponent(taskId)}`
    console.log('[QUERY] 调用 API:', apiEndpoint)

    // Query the Veo API
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log('[QUERY] API 错误:', response.status, errorText)
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[QUERY] 任务状态:', data.status, data.video_url ? '有视频URL' : '无视频URL')

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
    console.error('[QUERY] 异常:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query video' },
      { status: 500 }
    )
  }
}
