'use client'

import { useState } from 'react'
import { History, Clock, CheckCircle, XCircle, Loader2, Play, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { VideoGeneration, VideoGenerationBatch } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/locale'

interface GenerationHistoryProps {
  history: VideoGenerationBatch[]
  onRefresh: () => void
  loading: boolean
}

export function GenerationHistory({ history, onRefresh, loading }: GenerationHistoryProps) {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)
  const { t, locale } = useLocale()

  const statusConfig = {
    pending: { icon: Clock, label: t.pending, className: 'text-yellow-500' },
    processing: { icon: Loader2, label: t.processing, className: 'text-blue-500 animate-spin' },
    completed: { icon: CheckCircle, label: t.completed, className: 'text-green-500' },
    failed: { icon: XCircle, label: t.failed, className: 'text-red-500' },
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
  }

  const truncatePrompt = (prompt: string, maxLength = 60) => {
    return prompt.length > maxLength ? `${prompt.slice(0, maxLength)}...` : prompt
  }

  const getBatchSummary = (batch: VideoGenerationBatch) => {
    const parts = [
      `共 ${batch.total} 条`,
      `完成 ${batch.completed} 条`,
    ]

    if (batch.processing > 0) {
      parts.push(`生成中 ${batch.processing} 条`)
    }

    if (batch.pending > 0) {
      parts.push(`排队中 ${batch.pending} 条`)
    }

    if (batch.failed > 0) {
      parts.push(`失败 ${batch.failed} 条`)
    }

    return parts.join(' · ')
  }

  const getBatchPrimaryItem = (batch: VideoGenerationBatch) => {
    return batch.items[0]
  }

  const renderHistoryItem = (item: VideoGeneration, indexLabel?: string) => {
    const status = statusConfig[item.status]
    const StatusIcon = status.icon

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <StatusIcon className={cn('w-4 h-4', status.className)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {item.model}
                </span>
                {indexLabel && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {indexLabel}
                  </span>
                )}
              </div>
              <span className={cn('text-xs', status.className)}>{status.label}</span>
            </div>
            <p className="text-sm text-foreground mb-1">
              {truncatePrompt(item.prompt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(item.created_at)}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-1">{t.fullPrompt}</p>
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{item.prompt}</p>
        </div>

        {item.enhanced_prompt && (
          <div className="p-3 rounded-lg bg-accent/10">
            <p className="text-xs font-medium text-accent mb-1">{t.enhancedPrompt}</p>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{item.enhanced_prompt}</p>
          </div>
        )}

        {(item.first_image || item.last_image) && (
          <div className="flex gap-2">
            {item.first_image && (
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t.startFrame}</p>
                <img
                  src={item.first_image || '/placeholder.svg'}
                  alt="Start frame"
                  className="w-full aspect-video object-cover rounded-lg"
                />
              </div>
            )}
            {item.last_image && (
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t.endFrame}</p>
                <img
                  src={item.last_image || '/placeholder.svg'}
                  alt="End frame"
                  className="w-full aspect-video object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {item.video_url && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t.generatedVideo}</p>
            <video
              src={item.video_url}
              controls
              className="w-full rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                asChild
              >
                <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                  <Play className="w-4 h-4 mr-2" />
                  {t.open}
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                asChild
              >
                <a href={item.video_url} download>
                  <Download className="w-4 h-4 mr-2" />
                  {t.download}
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-end p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t.refresh
          )}
        </Button>
      </div>
      
      <ScrollArea className="min-h-0 flex-1">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <History className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t.noGenerationsYet}</p>
            <p className="text-xs text-muted-foreground/60">{t.generationsWillAppear}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {history.map((batch) => {
              const primaryItem = getBatchPrimaryItem(batch)

              if (!primaryItem) {
                return null
              }

              const status = batch.failed > 0 && batch.completed === 0 && batch.processing === 0 && batch.pending === 0
                ? statusConfig.failed
                : batch.processing > 0
                ? statusConfig.processing
                : batch.pending > 0
                ? statusConfig.pending
                : batch.completed > 0
                ? statusConfig.completed
                : statusConfig.failed

              const StatusIcon = status.icon
              const isExpanded = expandedBatchId === batch.id

              return (
                <div
                  key={batch.id}
                  className="border-b border-border last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <StatusIcon className={cn('w-4 h-4', status.className)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {primaryItem.model}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              批次 {batch.batchId.slice(-8)}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-1">
                          {truncatePrompt(primaryItem.prompt)}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatDate(batch.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getBatchSummary(batch)}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {batch.items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-border/60 bg-background/50 p-3 space-y-3">
                          {renderHistoryItem(item, `第 ${item.batch_index || 1} 行`)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
