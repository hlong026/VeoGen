import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, prompt, images, enhance_prompt, apiKey, apiBaseUrl } = body

    console.log('[CREATE] 收到请求:', { model, prompt: prompt?.substring(0, 50) + '...', imagesCount: images?.length || 0, enhance_prompt })

    if (!apiKey) {
      console.log('[CREATE] 错误: 缺少 API Key')
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
    }

    if (!prompt) {
      console.log('[CREATE] 错误: 缺少 Prompt')
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const baseUrl = apiBaseUrl || 'https://api.mooerai.xyz'
    console.log('[CREATE] 调用 API:', `${baseUrl}/v1/video/create`)

    // Call the Veo API
    let response: Response
    try {
      response = await fetch(`${baseUrl}/v1/video/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          images: images?.filter(Boolean) || [],
          enhance_prompt: enhance_prompt ?? true,
        }),
      })
    } catch (fetchError) {
      console.error('[CREATE] Fetch 失败:', fetchError)
      return NextResponse.json(
        { error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to API'}` },
        { status: 500 }
      )
    }

    const responseText = await response.text()
    console.log('[CREATE] API 响应状态:', response.status)
    console.log('[CREATE] API 响应内容:', responseText.substring(0, 500))
    
    if (!response.ok) {
      console.log('[CREATE] API 错误:', response.status, responseText)
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${responseText}` },
        { status: response.status }
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
      console.log('[CREATE] 解析成功, task_id:', data.id)
    } catch {
      console.log('[CREATE] JSON 解析失败:', responseText.substring(0, 200))
      return NextResponse.json(
        { error: `Invalid API response: ${responseText.substring(0, 200)}` },
        { status: 500 }
      )
    }

    // Save to database
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('video_generations')
      .insert({
        task_id: data.id,
        model,
        prompt,
        first_image: images?.[0] || null,
        last_image: images?.[1] || null,
        status: data.status || 'pending',
        enhanced_prompt: data.enhanced_prompt || null,
      })

    if (dbError) {
      console.error('[CREATE] 数据库错误:', dbError)
    } else {
      console.log('[CREATE] 已保存到数据库')
    }

    console.log('[CREATE] 请求完成, 返回 task_id:', data.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[CREATE] 异常:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create video' },
      { status: 500 }
    )
  }
}
