'use client'

import React from "react"

import { useState, useEffect, useCallback, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { Sparkles, Send, Loader2, History, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ImageUpload } from '@/components/video-gen/image-upload'
import { ApiConfig } from '@/components/video-gen/api-config'
import { GenerationHistory } from '@/components/video-gen/generation-history'
import { VideoPreview } from '@/components/video-gen/video-preview'
import { SettingsPanel } from '@/components/video-gen/settings-panel'
import type { VideoGeneration } from '@/lib/types'
import { useLocale } from '@/lib/locale'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HomePage() {
  const { t } = useLocale()

  // API Config State
  const [apiKey, setApiKey] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('https://yunwu.ai')
  const [model, setModel] = useState('veo3-fast-frames')

  // Generation Form State
  const [prompt, setPrompt] = useState('')
  const [firstImage, setFirstImage] = useState<string | null>(null)
  const [lastImage, setLastImage] = useState<string | null>(null)
  const [enhancePrompt, setEnhancePrompt] = useState(true)

  // Generation Status State
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch history
  const { data: history = [], isLoading: historyLoading } = useSWR<VideoGeneration[]>(
    '/api/video/history',
    fetcher,
    { refreshInterval: 30000 }
  )

  // Load saved config from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('veo-api-key')
    const savedApiBaseUrl = localStorage.getItem('veo-api-base-url')
    const savedModel = localStorage.getItem('veo-model')
    if (savedApiKey) setApiKey(savedApiKey)
    if (savedApiBaseUrl) setApiBaseUrl(savedApiBaseUrl)
    if (savedModel) setModel(savedModel)
  }, [])

  // Save config to localStorage
  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    localStorage.setItem('veo-api-key', value)
  }

  const handleApiBaseUrlChange = (value: string) => {
    setApiBaseUrl(value)
    localStorage.setItem('veo-api-base-url', value)
  }

  const handleModelChange = (value: string) => {
    setModel(value)
    localStorage.setItem('veo-model', value)
  }

  // Poll for task status
  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const params = new URLSearchParams({
        id: taskId,
        apiKey,
        apiBaseUrl,
      })
      const response = await fetch(`/api/video/query?${params}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setGenerationStatus('failed')
        setIsGenerating(false)
        return
      }

      setEnhancedPrompt(data.enhanced_prompt)

      if (data.video_url) {
        setVideoUrl(data.video_url)
        setGenerationStatus('completed')
        setIsGenerating(false)
        mutate('/api/video/history')
        return
      }

      if (data.status === 'failed') {
        setError('Video generation failed')
        setGenerationStatus('failed')
        setIsGenerating(false)
        return
      }

      // Continue polling
      setGenerationStatus(data.status === 'pending' ? 'pending' : 'processing')
      pollingRef.current = setTimeout(() => pollTaskStatus(taskId), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Polling failed')
      setGenerationStatus('failed')
      setIsGenerating(false)
    }
  }, [apiKey, apiBaseUrl])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) {
      setError(t.configureApiFirst)
      return
    }

    if (!prompt.trim()) {
      setError(t.enterPrompt)
      return
    }

    // Reset state
    setError(null)
    setVideoUrl(null)
    setEnhancedPrompt(null)
    setIsGenerating(true)
    setGenerationStatus('pending')

    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
    }

    try {
      const images: string[] = []
      if (firstImage) images.push(firstImage)
      if (lastImage) images.push(lastImage)

      const response = await fetch('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
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

      setCurrentTaskId(data.id)
      setEnhancedPrompt(data.enhanced_prompt)
      mutate('/api/video/history')

      // Start polling
      pollingRef.current = setTimeout(() => pollTaskStatus(data.id), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create video')
      setGenerationStatus('failed')
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground">{t.appName}</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* History Sheet Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.generationHistory}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg p-0">
                  <SheetHeader className="px-6 py-4 border-b border-border">
                    <SheetTitle>{t.generationHistory}</SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(100vh-73px)] overflow-hidden">
                    <GenerationHistory
                      history={history}
                      onRefresh={() => mutate('/api/video/history')}
                      loading={historyLoading}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <SettingsPanel />
              <ApiConfig
                apiKey={apiKey}
                apiBaseUrl={apiBaseUrl}
                model={model}
                onApiKeyChange={handleApiKeyChange}
                onApiBaseUrlChange={handleApiBaseUrlChange}
                onModelChange={handleModelChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full grid lg:grid-cols-2">
          {/* Left - Generation Form */}
          <div className="overflow-y-auto border-r border-border">
            <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">{t.createVideo}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t.appDescription}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Uploads - Optional first/last frame */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <ImageUpload
                    label={t.startFrame}
                    value={firstImage}
                    onChange={setFirstImage}
                    disabled={isGenerating}
                  />
                  <ImageUpload
                    label={t.endFrame}
                    value={lastImage}
                    onChange={setLastImage}
                    disabled={isGenerating}
                  />
                </div>

                {/* Prompt Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t.prompt}</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.promptPlaceholder}
                    className="min-h-[160px] bg-input border-border resize-none text-base leading-relaxed"
                    disabled={isGenerating}
                  />
                </div>

                {/* Options */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  <Switch
                    id="enhance-prompt"
                    checked={enhancePrompt}
                    onCheckedChange={setEnhancePrompt}
                    disabled={isGenerating}
                  />
                  <label
                    htmlFor="enhance-prompt"
                    className="text-sm text-foreground cursor-pointer select-none"
                  >
                    {t.enhancePrompt}
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-medium"
                  disabled={isGenerating || !apiKey}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.generating}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t.generateVideo}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Right - Video Preview */}
          <div className="overflow-y-auto bg-card/30 hidden lg:block">
            <div className="h-full flex items-center justify-center p-8">
              <div className="w-full max-w-lg">
                <VideoPreview
                  status={generationStatus}
                  videoUrl={videoUrl}
                  enhancedPrompt={enhancedPrompt}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Preview (visible on smaller screens) */}
      <div className="lg:hidden border-t border-border bg-card">
        <div className="p-4">
          <VideoPreview
            status={generationStatus}
            videoUrl={videoUrl}
            enhancedPrompt={enhancedPrompt}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
