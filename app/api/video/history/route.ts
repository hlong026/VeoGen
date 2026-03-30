import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { VideoGeneration, VideoGenerationBatch } from '@/lib/types'

const MAX_HISTORY_ITEMS = 50
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

function groupHistoryByBatch(history: VideoGeneration[]): VideoGenerationBatch[] {
  const batchMap = new Map<string, VideoGenerationBatch>()

  for (const item of history) {
    const batchId = item.batch_id || item.task_id
    const existingBatch = batchMap.get(batchId)

    if (!existingBatch) {
      batchMap.set(batchId, {
        id: batchId,
        batchId,
        createdAt: item.created_at,
        total: item.batch_total || 1,
        completed: item.status === 'completed' ? 1 : 0,
        failed: item.status === 'failed' ? 1 : 0,
        processing: item.status === 'processing' ? 1 : 0,
        pending: item.status === 'pending' ? 1 : 0,
        items: [item],
      })
      continue
    }

    existingBatch.items.push(item)
    existingBatch.completed += item.status === 'completed' ? 1 : 0
    existingBatch.failed += item.status === 'failed' ? 1 : 0
    existingBatch.processing += item.status === 'processing' ? 1 : 0
    existingBatch.pending += item.status === 'pending' ? 1 : 0

    if (new Date(item.created_at).getTime() > new Date(existingBatch.createdAt).getTime()) {
      existingBatch.createdAt = item.created_at
    }

    if (item.batch_total && item.batch_total > existingBatch.total) {
      existingBatch.total = item.batch_total
    }
  }

  return Array.from(batchMap.values())
    .map((batch) => ({
      ...batch,
      items: [...batch.items].sort((a, b) => {
        const firstIndex = a.batch_index ?? Number.MAX_SAFE_INTEGER
        const secondIndex = b.batch_index ?? Number.MAX_SAFE_INTEGER

        if (firstIndex !== secondIndex) {
          return firstIndex - secondIndex
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

async function fetchWithRetry(retries = 0): Promise<any> {
  try {
    console.log(`[HISTORY] Fetching history (attempt ${retries + 1}/${MAX_RETRIES})`)
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('video_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_ITEMS)

    if (error) {
      console.error(`[HISTORY] Database error (attempt ${retries + 1}):`, error.message)
      
      // Retry on network errors
      if (retries < MAX_RETRIES - 1 && error.message.includes('fetch')) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)))
        return fetchWithRetry(retries + 1)
      }
      
      throw error
    }

    console.log('[HISTORY] Success, returning', data?.length || 0, 'records')
    return { data: data || [], error: null }
  } catch (error) {
    console.error(`[HISTORY] Error (attempt ${retries + 1}):`, error)
    
    if (retries < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)))
      return fetchWithRetry(retries + 1)
    }
    
    return { data: null, error }
  }
}

export async function GET() {
  try {
    const { data, error } = await fetchWithRetry()

    if (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch history'
      console.error('[HISTORY] Final error:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json(groupHistoryByBatch((data || []) as VideoGeneration[]))
  } catch (error) {
    console.error('[HISTORY] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
