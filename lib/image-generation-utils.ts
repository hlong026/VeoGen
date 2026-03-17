/**
 * 图像生成 API 工具函数
 */

export interface ImageGenerationRequest {
  prompt: string
  apiKey: string
  model?: string
}

export interface ImageGenerationResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: {
          mimeType: string
          data: string
        }
        inline_data?: {
          mime_type: string
          data: string
        }
      }>
      role?: string
    }
    finishReason?: string
    index?: number
  }>
}

/**
 * 生成图像
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.5-flash-image-preview',
  config?: {
    aspectRatio?: string
    imageSize?: string
  }
): Promise<string> {
  const endpoint = `https://yunwu.ai/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  console.log('[IMAGE_GEN] 请求参数:', {
    model,
    endpoint,
    promptLength: prompt.length,
    config,
  })

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: config?.aspectRatio || '1:1',
        imageSize: config?.imageSize || '1K',
      },
    },
  }

  console.log('[IMAGE_GEN] 请求体:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log('[IMAGE_GEN] 响应状态:', response.status)

  if (!response.ok) {
    const error = await response.text()
    console.error('[IMAGE_GEN] 错误响应:', error)
    throw new Error(`图像生成失败: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as ImageGenerationResponse

  console.log('[IMAGE_GEN] 响应格式:', JSON.stringify(data, null, 2))

  // Extract image data from response - support both camelCase and snake_case
  const imageData = data.candidates?.[0]?.content?.parts?.find(
    (part) => {
      const mimeType = part.inlineData?.mimeType || part.inline_data?.mime_type
      return mimeType?.startsWith('image/')
    }
  )?.inlineData?.data || data.candidates?.[0]?.content?.parts?.find(
    (part) => part.inline_data?.mime_type?.startsWith('image/')
  )?.inline_data?.data

  if (!imageData) {
    console.error('[IMAGE_GEN] 响应中没有找到图像数据')
    console.error('[IMAGE_GEN] 完整响应:', JSON.stringify(data, null, 2))
    throw new Error('响应中没有图像数据')
  }

  console.log('[IMAGE_GEN] 成功生成图像，数据大小:', imageData.length)

  // Convert to base64 data URL
  const mimeType = data.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.mimeType || part.inline_data?.mime_type
  )?.inlineData?.mimeType || data.candidates?.[0]?.content?.parts?.find(
    (part) => part.inline_data?.mime_type
  )?.inline_data?.mime_type || 'image/jpeg'

  return `data:${mimeType};base64,${imageData}`
}

/**
 * 编辑图像
 */
export async function editImage(
  prompt: string,
  imageBase64: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp-image-generation'
): Promise<string> {
  const endpoint = `https://yunwu.ai/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  // Extract base64 data if it's a data URL
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64

  console.log('[IMAGE_EDIT] 请求参数:', {
    model,
    endpoint,
    promptLength: prompt.length,
    imageDataLength: base64Data.length,
  })

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '1K',
      },
    },
  }

  console.log('[IMAGE_EDIT] 请求体（不含图像数据）:', {
    contents: requestBody.contents.map(c => ({
      role: c.role,
      parts: c.parts.map(p => ({
        text: p.text,
        inline_data: p.inline_data ? { mime_type: p.inline_data.mime_type, dataLength: p.inline_data.data.length } : undefined,
      })),
    })),
    generationConfig: requestBody.generationConfig,
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log('[IMAGE_EDIT] 响应状态:', response.status)

  if (!response.ok) {
    const error = await response.text()
    console.error('[IMAGE_EDIT] 错误响应:', error)
    throw new Error(`图像编辑失败: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as ImageGenerationResponse

  console.log('[IMAGE_EDIT] 响应格式:', JSON.stringify(data, null, 2))

  // Extract image data from response
  const imageData = data.candidates?.[0]?.content?.parts?.find(
    (part) => part.inline_data?.mime_type?.startsWith('image/')
  )?.inline_data?.data

  if (!imageData) {
    console.error('[IMAGE_EDIT] 响应中没有找到图像数据')
    console.error('[IMAGE_EDIT] 完整响应:', JSON.stringify(data, null, 2))
    throw new Error('响应中没有图像数据')
  }

  console.log('[IMAGE_EDIT] 成功编辑图像，数据大小:', imageData.length)

  // Convert to base64 data URL
  return `data:image/jpeg;base64,${imageData}`
}
