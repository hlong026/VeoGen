import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildApiEndpoint, createApiHeaders, handleApiResponse } from '@/lib/api-utils'
import type { CreateVideoResponse, ApiErrorResponse } from '@/lib/types'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PROMPT_LENGTH = 2000

function validateRequest(model: string, prompt: string, apiKey: string) {
  if (!apiKey) {
    return { valid: false, error: 'API Key is required' }
  }
  if (!model) {
    return { valid: false, error: 'Model is required' }
  }
  if (!prompt?.trim()) {
    return { valid: false, error: 'Prompt is required' }
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt must be less than ${MAX_PROMPT_LENGTH} characters` }
  }
  return { valid: true }
}

function validateImages(images: string[] | undefined) {
  if (!images) return { valid: true, images: [] }
  
  const validImages = images.filter(Boolean)
  
  for (const img of validImages) {
    if (img.length > MAX_IMAGE_SIZE) {
      return { valid: false, error: 'Image size exceeds 10MB limit' }
    }
  }
  
  return { valid: true, images: validImages }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, prompt, images, enhance_prompt, apiKey, apiBaseUrl } = body

    // Validate request
    const validation = validateRequest(model, prompt, apiKey)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Validate images
    const imageValidation = validateImages(images)
    if (!imageValidation.valid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 })
    }

    const apiEndpoint = buildApiEndpoint(apiBaseUrl, '/video/create')
    console.log('[CREATE] Calling API:', apiEndpoint)

    // Call the Veo API
    let response: Response
    try {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: createApiHeaders(apiKey),
        body: JSON.stringify({
          model,
          prompt,
          images: imageValidation.images,
          enhance_prompt: enhance_prompt ?? true,
        }),
      })
    } catch (fetchError) {
      console.error('[CREATE] Network error:', fetchError)
      return NextResponse.json(
        { error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to API'}` },
        { status: 500 }
      )
    }

    const data = await handleApiResponse<CreateVideoResponse>(response)
    console.log('[CREATE] Success, task_id:', data.id)

    // Save to database (non-blocking)
    try {
      const supabase = await createClient()
      await supabase.from('video_generations').insert({
        task_id: data.id,
        model,
        prompt,
        first_image: imageValidation.images[0] || null,
        last_image: imageValidation.images[1] || null,
        status: data.status || 'pending',
        enhanced_prompt: data.enhanced_prompt || null,
      })
    } catch (dbErr) {
      console.error('[CREATE] Database error:', dbErr)
      // Don't fail the request if database save fails
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[CREATE] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create video'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
