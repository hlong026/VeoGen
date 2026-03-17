import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_HISTORY_ITEMS = 50
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

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

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[HISTORY] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
