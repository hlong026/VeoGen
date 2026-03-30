'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { mutate } from 'swr'
import { Send, Loader2, X, AlertCircle, Sparkles, Film, Plus, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from './image-upload'
import type { CreateVideoResponse, QueryVideoResponse, VideoStatus } from '@/lib/types'

interface VideoGenerationPageProps {
  apiKey: string
  videoModel: string
  apiBaseUrl: string
  theme: 'light' | 'dark'
}

type BatchVideoRowStatus = 'idle' | 'submitting' | VideoStatus

interface BatchVideoRow {
  localId: string
  firstImage: string | null
  lastImage: string | null
  prompt: string
  remoteTaskId: string | null
  enhancedPrompt: string | null
  videoUrl: string | null
  error: string | null
  status: BatchVideoRowStatus
}

const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 120

function createRowId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createBatchId() {
  return `batch-${createRowId()}`
}

function createEmptyRow(): BatchVideoRow {
  return {
    localId: createRowId(),
    firstImage: null,
    lastImage: null,
    prompt: '',
    remoteTaskId: null,
    enhancedPrompt: null,
    videoUrl: null,
    error: null,
    status: 'idle',
  }
}

function getRowStatusLabel(status: BatchVideoRowStatus) {
  switch (status) {
    case 'submitting':
      return '提交中'
    case 'pending':
      return '排队中'
    case 'processing':
      return '生成中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return '待填写'
  }
}

function getRowStatusClassName(status: BatchVideoRowStatus, theme: 'light' | 'dark') {
  if (status === 'completed') {
    return theme === 'dark'
      ? 'bg-green-500/10 text-green-300 border-green-500/20'
      : 'bg-green-50 text-green-700 border-green-200'
  }

  if (status === 'failed') {
    return theme === 'dark'
      ? 'bg-red-500/10 text-red-300 border-red-500/20'
      : 'bg-red-50 text-red-700 border-red-200'
  }

  if (status === 'pending' || status === 'processing' || status === 'submitting') {
    return theme === 'dark'
      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
      : 'bg-blue-50 text-blue-700 border-blue-200'
  }

  return theme === 'dark'
    ? 'bg-slate-800/80 text-slate-300 border-slate-700/60'
    : 'bg-slate-100 text-slate-700 border-slate-200'
}

function hasActiveRows(rows: BatchVideoRow[]) {
  return rows.some((row) => row.status === 'submitting' || row.status === 'pending' || row.status === 'processing')
}

export function VideoGenerationPage({
  apiKey,
  videoModel,
  apiBaseUrl,
  theme,
}: VideoGenerationPageProps) {
  const [rows, setRows] = useState<BatchVideoRow[]>([createEmptyRow()])
  const [enhancePrompt, setEnhancePrompt] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const rowsRef = useRef<BatchVideoRow[]>([createEmptyRow()])
  const pollAttemptsRef = useRef<Record<string, number>>({})
  const stopRequestedRef = useRef(false)

  const cardBg = theme === 'dark' ? 'bg-slate-900/80 border-slate-800/50' : 'bg-white/80 border-slate-200/50'
  const inputBg = theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/90 border-slate-300/50'
  const inputText = theme === 'dark' ? 'text-slate-100 placeholder-slate-500' : 'text-slate-950 placeholder-slate-600'

  const updateRows = useCallback((updater: (prev: BatchVideoRow[]) => BatchVideoRow[]) => {
    setRows((prev) => {
      const next = updater(prev)
      rowsRef.current = next
      return next
    })
  }, [])

  const updateRow = useCallback((localId: string, updater: (row: BatchVideoRow) => BatchVideoRow) => {
    updateRows((prev) => prev.map((row) => (row.localId === localId ? updater(row) : row)))
  }, [updateRows])

  const scheduleNextPoll = useCallback((callback: () => void) => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
    }

    pollingRef.current = setTimeout(callback, POLL_INTERVAL_MS)
  }, [])

  const pollRows = useCallback(async () => {
    const activeRows = rowsRef.current.filter(
      (row) => row.remoteTaskId && (row.status === 'pending' || row.status === 'processing')
    )

    if (activeRows.length === 0 || stopRequestedRef.current) {
      setIsGenerating(false)
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    await Promise.all(
      activeRows.map(async (row) => {
        const currentAttempts = (pollAttemptsRef.current[row.localId] || 0) + 1
        pollAttemptsRef.current[row.localId] = currentAttempts

        if (currentAttempts > MAX_POLL_ATTEMPTS) {
          updateRow(row.localId, (currentRow) => ({
            ...currentRow,
            status: 'failed',
            error: '视频生成超时',
          }))
          return
        }

        try {
          const params = new URLSearchParams({ id: row.remoteTaskId || '', apiKey, apiBaseUrl })
          const response = await fetch(`/api/video/query?${params}`)
          const data = (await response.json()) as QueryVideoResponse & { error?: string }

          if (data.error) {
            updateRow(row.localId, (currentRow) => ({
              ...currentRow,
              status: 'failed',
              error: data.error || '轮询失败',
            }))
            return
          }

          updateRow(row.localId, (currentRow) => ({
            ...currentRow,
            enhancedPrompt: data.enhanced_prompt ?? currentRow.enhancedPrompt,
            videoUrl: data.video_url ?? currentRow.videoUrl,
            status: data.video_url ? 'completed' : data.status,
            error: data.status === 'failed' ? '视频生成失败' : null,
          }))
        } catch (err) {
          updateRow(row.localId, (currentRow) => ({
            ...currentRow,
            status: 'failed',
            error: err instanceof Error ? err.message : '轮询失败',
          }))
        }
      })
    )

    mutate('/api/video/history')

    if (!stopRequestedRef.current && hasActiveRows(rowsRef.current)) {
      scheduleNextPoll(() => {
        void pollRows()
      })
      return
    }

    setIsGenerating(false)
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [apiBaseUrl, apiKey, scheduleNextPoll, updateRow])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [])

  const handleAddRow = () => {
    updateRows((prev) => [...prev, createEmptyRow()])
  }

  const handleDeleteRow = (localId: string) => {
    updateRows((prev) => {
      const next = prev.filter((row) => row.localId !== localId)
      return next.length > 0 ? next : [createEmptyRow()]
    })
  }

  const handleDeleteEmptyRows = () => {
    updateRows((prev) => {
      const next = prev.filter((row) => row.prompt.trim() || row.firstImage || row.lastImage)
      return next.length > 0 ? next : [createEmptyRow()]
    })
  }

  const handleRowChange = (localId: string, patch: Partial<BatchVideoRow>) => {
    updateRow(localId, (row) => ({
      ...row,
      ...patch,
      error: patch.error === undefined ? null : patch.error,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) {
      setBatchError('请先配置视频 API 密钥')
      return
    }

    if (!videoModel.trim()) {
      setBatchError('请配置视频模型')
      return
    }

    const validatedRows = rowsRef.current.map((row, index) => {
      if (!row.firstImage) {
        return { ...row, error: `第 ${index + 1} 行请上传首帧`, status: 'idle' as BatchVideoRowStatus }
      }

      if (!row.lastImage) {
        return { ...row, error: `第 ${index + 1} 行请上传尾帧`, status: 'idle' as BatchVideoRowStatus }
      }

      if (!row.prompt.trim()) {
        return { ...row, error: `第 ${index + 1} 行请输入提示词`, status: 'idle' as BatchVideoRowStatus }
      }

      if (row.prompt.length > 2000) {
        return { ...row, error: `第 ${index + 1} 行提示词不能超过 2000 个字符`, status: 'idle' as BatchVideoRowStatus }
      }

      return {
        ...row,
        remoteTaskId: null,
        enhancedPrompt: null,
        videoUrl: null,
        error: null,
        status: 'idle' as BatchVideoRowStatus,
      }
    })

    rowsRef.current = validatedRows
    setRows(validatedRows)

    if (validatedRows.some((row) => row.error)) {
      setBatchError('请先完善所有任务行，再进行批量生成')
      return
    }

    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }

    stopRequestedRef.current = false
    pollAttemptsRef.current = {}
    setBatchError(null)
    setIsGenerating(true)
    const batchId = createBatchId()
    const batchTotal = validatedRows.length

    for (const [index, row] of validatedRows.entries()) {
      if (stopRequestedRef.current) {
        break
      }

      updateRow(row.localId, (currentRow) => ({
        ...currentRow,
        status: 'submitting',
        error: null,
      }))

      try {
        const response = await fetch('/api/video/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: videoModel,
            prompt: row.prompt,
            images: [row.firstImage, row.lastImage].filter(Boolean),
            enhance_prompt: enhancePrompt,
            batch_id: batchId,
            batch_index: index + 1,
            batch_total: batchTotal,
            apiKey,
            apiBaseUrl,
          }),
        })

        const data = (await response.json()) as CreateVideoResponse & { error?: string }

        if (data.error) {
          updateRow(row.localId, (currentRow) => ({
            ...currentRow,
            status: 'failed',
            error: data.error || '创建视频失败',
          }))
          continue
        }

        pollAttemptsRef.current[row.localId] = 0
        updateRow(row.localId, (currentRow) => ({
          ...currentRow,
          remoteTaskId: data.id,
          enhancedPrompt: data.enhanced_prompt ?? null,
          videoUrl: data.video_url ?? null,
          error: null,
          status: data.video_url ? 'completed' : data.status,
        }))
      } catch (err) {
        updateRow(row.localId, (currentRow) => ({
          ...currentRow,
          status: 'failed',
          error: err instanceof Error ? err.message : '创建视频失败',
        }))
      }
    }

    mutate('/api/video/history')

    if (!stopRequestedRef.current && hasActiveRows(rowsRef.current)) {
      scheduleNextPoll(() => {
        void pollRows()
      })
      return
    }

    setIsGenerating(false)
  }

  const handleCancel = () => {
    stopRequestedRef.current = true

    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }

    setIsGenerating(false)
    setBatchError('已停止继续提交和轮询，你可以在历史记录中查看已创建任务的后续状态')
  }

  const completedCount = rows.filter((row) => row.status === 'completed').length
  const failedCount = rows.filter((row) => row.status === 'failed').length

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-6">
      {/* 左侧：表单区域 */}
      <div className="lg:w-[480px] flex-shrink-0 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 关键帧 */}
          <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${cardBg}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">任务行</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRow} disabled={isGenerating}>
                <Plus className="w-4 h-4 mr-2" />
                新增一行
              </Button>
            </div>
            <div className="space-y-4">
              {rows.map((row, index) => (
                <div
                  key={row.localId}
                  className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                        第 {index + 1} 行
                      </span>
                      <span className={`text-xs border px-2.5 py-1 rounded-full ${getRowStatusClassName(row.status, theme)}`}>
                        {getRowStatusLabel(row.status)}
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteRow(row.localId)} disabled={isGenerating}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <ImageUpload
                      label="首帧"
                      value={row.firstImage}
                      onChange={(value) => handleRowChange(row.localId, { firstImage: value })}
                      disabled={isGenerating}
                    />
                    <ImageUpload
                      label="尾帧"
                      value={row.lastImage}
                      onChange={(value) => handleRowChange(row.localId, { lastImage: value })}
                      disabled={isGenerating}
                    />
                  </div>

                  <Textarea
                    value={row.prompt}
                    onChange={(e) => handleRowChange(row.localId, { prompt: e.target.value })}
                    placeholder="请输入这一行的视频提示词..."
                    className={`min-h-[120px] resize-none rounded-xl ${inputBg} ${inputText} focus:ring-2 focus:ring-blue-500`}
                    disabled={isGenerating}
                  />

                  <div className="flex items-center justify-between mt-2 gap-3">
                    <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {row.prompt.length} / 2000
                    </div>
                    {row.error && (
                      <div className={`text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
                        {row.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 提示词 */}
          <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${cardBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">批量说明</h3>
            </div>
            <div className={`text-sm leading-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              每一行都是一个独立的视频任务，系统会严格使用本行的首帧、尾帧和提示词进行生成，不会跨行混用。
            </div>
          </div>

          {/* 选项 */}
          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${cardBg}`}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">自动增强提示词</label>
              <Switch checked={enhancePrompt} onCheckedChange={setEnhancePrompt} disabled={isGenerating} />
            </div>
          </div>

          {/* 错误 */}
          {batchError && (
            <div className={`p-4 rounded-xl border flex items-start gap-2 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
              <AlertCircle className={`w-4 h-4 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>{batchError}</p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" className="flex-1 h-12" onClick={handleDeleteEmptyRows} disabled={isGenerating}>
                <Trash2 className="w-5 h-5 mr-2" />
                删除空行
              </Button>
              {isGenerating ? (
                <Button type="button" variant="outline" size="lg" className="h-12" onClick={handleCancel}>
                  <X className="w-5 h-5" />
                </Button>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20" disabled={!apiKey || isGenerating}>
              {isGenerating ? (
                <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                生成中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  批量生成视频
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 右侧：预览区域 */}
      <div className="flex-1 min-h-[600px]">
        <div className={`h-full p-6 rounded-2xl border backdrop-blur-sm flex flex-col ${cardBg}`}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h3 className="font-semibold">结果</h3>
            <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              已完成 {completedCount} 条，失败 {failedCount} 条，共 {rows.length} 条
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {rows.map((row, index) => (
              <div
                key={row.localId}
                className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'}`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                      第 {index + 1} 行
                    </span>
                    <span className={`text-xs border px-2.5 py-1 rounded-full ${getRowStatusClassName(row.status, theme)}`}>
                      {getRowStatusLabel(row.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-900/80 border border-slate-800/60' : 'bg-white border border-slate-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>原提示词</p>
                    <p className="text-sm whitespace-pre-wrap break-words">{row.prompt || '未填写'}</p>
                  </div>

                  {row.enhancedPrompt && (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>增强后提示词</p>
                      <p className="text-sm whitespace-pre-wrap break-words">{row.enhancedPrompt}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>首帧</p>
                      <div className={`rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                        {row.firstImage ? (
                          <img src={row.firstImage} alt={`第 ${index + 1} 行首帧`} className="w-full aspect-video object-cover" />
                        ) : (
                          <div className={`w-full aspect-video flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                            未上传
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>尾帧</p>
                      <div className={`rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                        {row.lastImage ? (
                          <img src={row.lastImage} alt={`第 ${index + 1} 行尾帧`} className="w-full aspect-video object-cover" />
                        ) : (
                          <div className={`w-full aspect-video flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                            未上传
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-white'} aspect-video flex items-center justify-center`}>
                    {(row.status === 'submitting' || row.status === 'pending' || row.status === 'processing') && (
                      <div className="text-center">
                        <div className="relative w-14 h-14 mx-auto mb-3">
                          <div className={`absolute inset-0 rounded-full border-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`} />
                          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        </div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          {row.status === 'submitting' ? '提交中...' : row.status === 'pending' ? '排队中...' : '生成中...'}
                        </p>
                      </div>
                    )}

                    {row.status === 'completed' && row.videoUrl && (
                      <video src={row.videoUrl} controls className="w-full h-full object-contain" />
                    )}

                    {row.status === 'failed' && (
                      <div className="text-center px-4">
                        <AlertCircle className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                        <p className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>{row.error || '生成失败'}</p>
                      </div>
                    )}

                    {row.status === 'idle' && (
                      <div className="text-center px-4">
                        <Film className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>等待提交本行任务</p>
                      </div>
                    )}
                  </div>

                  {row.videoUrl && (
                    <Button asChild className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20">
                      <a href={row.videoUrl} download={`video-row-${index + 1}.mp4`}>
                        <Download className="w-4 h-4 mr-2" />
                        下载视频
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
