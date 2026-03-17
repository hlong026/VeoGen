'use client'

import { useState, useCallback, useRef } from 'react'
import { mutate } from 'swr'
import { Send, Loader2, X, AlertCircle, Sparkles, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from './image-upload'
import { VideoPreview } from './video-preview'

interface VideoGenerationPageProps {
  apiKey: string
  videoModel: string
  apiBaseUrl: string
  theme: 'light' | 'dark'
}

export function VideoGenerationPage({
  apiKey,
  videoModel,
  apiBaseUrl,
  theme,
}: VideoGenerationPageProps) {
  const [prompt, setPrompt] = useState('')
  const [firstImage, setFirstImage] = useState<string | null>(null)
  const [lastImage, setLastImage] = useState<string | null>(null)
  const [enhancePrompt, setEnhancePrompt] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef<number>(0)

  const cardBg = theme === 'dark' ? 'bg-slate-900/80 border-slate-800/50' : 'bg-white/80 border-slate-200/50'
  const inputBg = theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/90 border-slate-300/50'
  const inputText = theme === 'dark' ? 'text-slate-100 placeholder-slate-500' : 'text-slate-950 placeholder-slate-600'

  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      if (pollCountRef.current >= 120) {
        setError('视频生成超时')
        setGenerationStatus('failed')
        setIsGenerating(false)
        pollCountRef.current = 0
        return
      }

      pollCountRef.current += 1
      const params = new URLSearchParams({ id: taskId, apiKey, apiBaseUrl })
      const response = await fetch(`/api/video/query?${params}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setGenerationStatus('failed')
        setIsGenerating(false)
        pollCountRef.current = 0
        return
      }

      setEnhancedPrompt(data.enhanced_prompt)

      if (data.video_url) {
        setVideoUrl(data.video_url)
        setGenerationStatus('completed')
        setIsGenerating(false)
        pollCountRef.current = 0
        mutate('/api/video/history')
        return
      }

      if (data.status === 'failed') {
        setError('视频生成失败')
        setGenerationStatus('failed')
        setIsGenerating(false)
        pollCountRef.current = 0
        return
      }

      setGenerationStatus(data.status === 'pending' ? 'pending' : 'processing')
      pollingRef.current = setTimeout(() => pollTaskStatus(taskId), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '轮询失败')
      setGenerationStatus('failed')
      setIsGenerating(false)
      pollCountRef.current = 0
    }
  }, [apiKey, apiBaseUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) {
      setError('请先配置视频 API 密钥')
      return
    }

    if (!videoModel.trim()) {
      setError('请配置视频模型')
      return
    }

    if (!prompt.trim()) {
      setError('请输入视频描述')
      return
    }

    if (prompt.length > 2000) {
      setError('描述不能超过 2000 个字符')
      return
    }

    setError(null)
    setVideoUrl(null)
    setEnhancedPrompt(null)
    setIsGenerating(true)
    setGenerationStatus('pending')
    pollCountRef.current = 0

    if (pollingRef.current) clearTimeout(pollingRef.current)

    try {
      const images: string[] = []
      if (firstImage) images.push(firstImage)
      if (lastImage) images.push(lastImage)

      const response = await fetch('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: videoModel,
          prompt,
          images,
          enhance_prompt: enhancePrompt,
          apiKey,
          apiBaseUrl,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setGenerationStatus('failed')
        setIsGenerating(false)
        return
      }

      setEnhancedPrompt(data.enhanced_prompt)
      mutate('/api/video/history')
      pollingRef.current = setTimeout(() => pollTaskStatus(data.id), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建视频失败')
      setGenerationStatus('failed')
      setIsGenerating(false)
    }
  }

  const handleCancel = () => {
    if (pollingRef.current) clearTimeout(pollingRef.current)
    setIsGenerating(false)
    setGenerationStatus('idle')
    pollCountRef.current = 0
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-6">
      {/* 左侧：表单区域 */}
      <div className="lg:w-[480px] flex-shrink-0 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 关键帧 */}
          <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${cardBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">关键帧</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ImageUpload label="起始帧" value={firstImage} onChange={setFirstImage} disabled={isGenerating} />
              <ImageUpload label="结束帧" value={lastImage} onChange={setLastImage} disabled={isGenerating} />
            </div>
          </div>

          {/* 提示词 */}
          <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${cardBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">视频描述</h3>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的视频..."
              className={`min-h-[140px] resize-none rounded-xl ${inputBg} ${inputText} focus:ring-2 focus:ring-blue-500`}
              disabled={isGenerating}
            />
            <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {prompt.length} / 2000
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
          {error && (
            <div className={`p-4 rounded-xl border flex items-start gap-2 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
              <AlertCircle className={`w-4 h-4 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          {/* 按钮 */}
          {isGenerating ? (
            <div className="flex gap-3">
              <Button type="submit" size="lg" className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg" disabled>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                生成中...
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-12" onClick={handleCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Button type="submit" size="lg" className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20" disabled={!apiKey}>
              <Send className="w-5 h-5 mr-2" />
              生成视频
            </Button>
          )}
        </form>
      </div>

      {/* 右侧：预览区域 */}
      <div className="flex-1 min-h-[600px]">
        <div className={`h-full p-6 rounded-2xl border backdrop-blur-sm ${cardBg}`}>
          <h3 className="font-semibold mb-4">预览</h3>
          <VideoPreview status={generationStatus} videoUrl={videoUrl} enhancedPrompt={enhancedPrompt} error={error} />
        </div>
      </div>
    </div>
  )
}
