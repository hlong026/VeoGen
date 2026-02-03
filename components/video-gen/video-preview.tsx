'use client'

import { useState } from 'react'
import { Video, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/locale'

interface VideoPreviewProps {
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl: string | null
  enhancedPrompt: string | null
  error: string | null
}

export function VideoPreview({ status, videoUrl, enhancedPrompt, error }: VideoPreviewProps) {
  const { t } = useLocale()
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  const statusLabels = {
    idle: t.idle,
    pending: t.pending,
    processing: t.processing,
    completed: t.completed,
    failed: t.failed,
  }

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t.preview}</h2>
        {status !== 'idle' && (
          <div className={cn(
            'flex items-center gap-2 text-sm px-3 py-1 rounded-full',
            status === 'pending' && 'bg-yellow-500/10 text-yellow-500',
            status === 'processing' && 'bg-blue-500/10 text-blue-500',
            status === 'completed' && 'bg-green-500/10 text-green-500',
            status === 'failed' && 'bg-red-500/10 text-red-500',
          )}>
            {status === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'completed' && <CheckCircle className="w-3 h-3" />}
            {status === 'failed' && <AlertCircle className="w-3 h-3" />}
            <span>{statusLabels[status]}</span>
          </div>
        )}
      </div>

      <div 
        className="relative rounded-xl overflow-hidden bg-muted/30 border border-border"
        style={{ aspectRatio: aspectRatio && status === 'completed' ? aspectRatio : 16/9 }}
      >
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Video className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm">{t.videoWillAppear}</p>
          </div>
        )}

        {(status === 'pending' || status === 'processing') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {status === 'pending' ? t.initializing : t.generatingVideo}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {t.mayTakeFewMinutes}
            </p>
          </div>
        )}

        {status === 'completed' && videoUrl && (
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            onLoadedMetadata={handleVideoLoad}
            className="w-full h-full object-contain"
          />
        )}

        {status === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="text-sm font-medium">{t.generationFailed}</p>
            {error && (
              <p className="text-xs text-muted-foreground mt-2 max-w-xs text-center">{error}</p>
            )}
          </div>
        )}
      </div>

      {enhancedPrompt && status !== 'idle' && (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-xs font-medium text-accent mb-2">{t.enhancedPrompt}</p>
          <p className="text-sm text-foreground leading-relaxed">{enhancedPrompt}</p>
        </div>
      )}

      {status === 'completed' && videoUrl && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" asChild>
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              {t.openInNewTab}
            </a>
          </Button>
          <Button className="flex-1" asChild>
            <a href={videoUrl} download>
              {t.downloadVideo}
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
