import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('[HISTORY] 获取历史记录')
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('video_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.log('[HISTORY] 数据库错误:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[HISTORY] 返回', data?.length || 0, '条记录')
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[HISTORY] 异常:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
