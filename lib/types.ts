export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface VideoGeneration {
  id: string
  task_id: string
  batch_id: string | null
  batch_index: number | null
  batch_total: number | null
  model: string
  prompt: string
  first_image: string | null
  last_image: string | null
  status: VideoStatus
  video_url: string | null
  enhanced_prompt: string | null
  created_at: string
  updated_at: string
}

export interface CreateVideoRequest {
  model: string
  prompt: string
  images?: string[]
  enhance_prompt?: boolean
  batch_id?: string
  batch_index?: number
  batch_total?: number
  apiKey: string
  apiBaseUrl: string
}

export interface CreateVideoResponse {
  id: string
  status: VideoStatus
  video_url: string | null
  enhanced_prompt: string | null
  status_update_time?: number
}

export interface QueryVideoResponse {
  id: string
  status: VideoStatus
  video_url: string | null
  enhanced_prompt: string | null
  status_update_time?: number
}

export interface ApiErrorResponse {
  error: string
  details?: string
}

export interface PollConfig {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
}

export interface VideoGenerationBatch {
  id: string
  batchId: string
  createdAt: string
  total: number
  completed: number
  failed: number
  processing: number
  pending: number
  items: VideoGeneration[]
}

export type GenerationType = 'video' | 'image'

export interface ImageGeneration {
  id: string
  prompt: string
  image_url: string
  model: string
  created_at: string
}

export interface GenerationMode {
  type: GenerationType
  label: string
  icon: string
}
