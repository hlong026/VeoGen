export interface VideoGeneration {
  id: string
  task_id: string
  model: string
  prompt: string
  first_image: string | null
  last_image: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
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
}

export interface CreateVideoResponse {
  id: string
  status: string
  video_url: string | null
  enhanced_prompt: string
  status_update_time: number
}

export interface QueryVideoResponse {
  id: string
  status: string
  video_url: string | null
  enhanced_prompt: string
  status_update_time: number
}
