/**
 * API 工具函数 - 统一处理 API 端点和请求
 */

export interface ApiConfig {
  apiKey: string
  apiBaseUrl: string
}

/**
 * 构建 API 端点 URL
 */
export function buildApiEndpoint(baseUrl: string, path: string): string {
  const cleanBaseUrl = (baseUrl || 'https://api.mooerai.xyz').replace(/\/+$/, '')
  
  // 如果 baseUrl 已包含 /v1，直接拼接 path
  if (cleanBaseUrl.endsWith('/v1')) {
    return `${cleanBaseUrl}${path}`
  }
  
  // 否则在中间插入 /v1
  return `${cleanBaseUrl}/v1${path}`
}

/**
 * 创建 API 请求头
 */
export function createApiHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
}

/**
 * 处理 API 响应
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text()
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${responseText}`)
  }
  
  try {
    return JSON.parse(responseText) as T
  } catch {
    throw new Error(`Invalid API response: ${responseText.substring(0, 200)}`)
  }
}

/**
 * 重试机制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}
