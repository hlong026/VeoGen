import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, prompt, images, enhance_prompt, apiKey, apiBaseUrl } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const baseUrl = apiBaseUrl || 'https://yunwu.ai'

    // Call the Veo API
    const response = await fetch(`${baseUrl}/v1/video/create`, {
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

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

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
      console.error('Database error:', dbError)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create video error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create video' },
      { status: 500 }
    )
  }
}
