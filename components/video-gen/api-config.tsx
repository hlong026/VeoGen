'use client'

import { useState } from 'react'
import { Settings, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useLocale } from '@/lib/locale'

interface ApiConfigProps {
  videoApiKey: string
  imageApiKey: string
  videoApiUrl: string
  imageApiUrl: string
  videoModel: string
  imageModel: string
  onVideoApiKeyChange: (value: string) => void
  onImageApiKeyChange: (value: string) => void
  onVideoApiUrlChange: (value: string) => void
  onImageApiUrlChange: (value: string) => void
  onVideoModelChange: (value: string) => void
  onImageModelChange: (value: string) => void
}

export function ApiConfig({
  videoApiKey,
  imageApiKey,
  videoApiUrl,
  imageApiUrl,
  videoModel,
  imageModel,
  onVideoApiKeyChange,
  onImageApiKeyChange,
  onVideoApiUrlChange,
  onImageApiUrlChange,
  onVideoModelChange,
  onImageModelChange,
}: ApiConfigProps) {
  const [showKey, setShowKey] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video')
  const [tempVideoKey, setTempVideoKey] = useState(videoApiKey)
  const [tempImageKey, setTempImageKey] = useState(imageApiKey)
  const [tempVideoUrl, setTempVideoUrl] = useState(videoApiUrl)
  const [tempImageUrl, setTempImageUrl] = useState(imageApiUrl)
  const [tempVideoModel, setTempVideoModel] = useState(videoModel)
  const [tempImageModel, setTempImageModel] = useState(imageModel)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { t } = useLocale()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (activeTab === 'video') {
      if (!tempVideoKey.trim()) {
        newErrors.videoKey = 'Video API Key is required'
      }
      if (!tempVideoUrl.trim()) {
        newErrors.videoUrl = 'Video API URL is required'
      } else {
        try {
          new URL(tempVideoUrl)
        } catch {
          newErrors.videoUrl = 'Invalid URL format'
        }
      }
      if (!tempVideoModel.trim()) {
        newErrors.videoModel = 'Video Model is required'
      }
    } else {
      if (!tempImageKey.trim()) {
        newErrors.imageKey = 'Image API Key is required'
      }
      if (!tempImageUrl.trim()) {
        newErrors.imageUrl = 'Image API URL is required'
      } else {
        try {
          new URL(tempImageUrl)
        } catch {
          newErrors.imageUrl = 'Invalid URL format'
        }
      }
      if (!tempImageModel.trim()) {
        newErrors.imageModel = 'Image Model is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTempVideoKey(videoApiKey)
      setTempImageKey(imageApiKey)
      setTempVideoUrl(videoApiUrl)
      setTempImageUrl(imageApiUrl)
      setTempVideoModel(videoModel)
      setTempImageModel(imageModel)
      setErrors({})
    }
    setOpen(isOpen)
  }

  const handleSave = () => {
    if (!validateForm()) return

    if (activeTab === 'video') {
      onVideoApiKeyChange(tempVideoKey)
      onVideoApiUrlChange(tempVideoUrl)
      onVideoModelChange(tempVideoModel)
    } else {
      onImageApiKeyChange(tempImageKey)
      onImageApiUrlChange(tempImageUrl)
      onImageModelChange(tempImageModel)
    }
    setOpen(false)
  }

  const isConfigured = videoApiKey.length > 0 && imageApiKey.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={isConfigured ? 'border-accent text-accent bg-transparent' : 'bg-transparent'}
        >
          <Settings className="w-4 h-4 mr-2" />
          {t.apiSettings}
          {isConfigured && <Check className="w-3 h-3 ml-2" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.apiConfiguration}</DialogTitle>
          <DialogDescription>
            Configure separate API keys for video and image generation
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'video' | 'image')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video">Video API</TabsTrigger>
            <TabsTrigger value="image">Image API</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Video API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Enter your video API key"
                  value={tempVideoKey}
                  onChange={(e) => {
                    setTempVideoKey(e.target.value)
                    if (errors.videoKey) {
                      setErrors({ ...errors, videoKey: '' })
                    }
                  }}
                  className="pr-10 bg-input border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.videoKey && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.videoKey}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Video API URL</label>
              <Input
                type="text"
                placeholder="https://api.mooerai.xyz"
                value={tempVideoUrl}
                onChange={(e) => {
                  setTempVideoUrl(e.target.value)
                  if (errors.videoUrl) {
                    setErrors({ ...errors, videoUrl: '' })
                  }
                }}
                className="bg-input border-border"
              />
              {errors.videoUrl && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.videoUrl}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Video Model</label>
              <Input
                type="text"
                placeholder="e.g., veo3-fast-frames"
                value={tempVideoModel}
                onChange={(e) => {
                  setTempVideoModel(e.target.value)
                  if (errors.videoModel) {
                    setErrors({ ...errors, videoModel: '' })
                  }
                }}
                className="bg-input border-border"
              />
              {errors.videoModel && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.videoModel}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Image API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Enter your image API key"
                  value={tempImageKey}
                  onChange={(e) => {
                    setTempImageKey(e.target.value)
                    if (errors.imageKey) {
                      setErrors({ ...errors, imageKey: '' })
                    }
                  }}
                  className="pr-10 bg-input border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.imageKey && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.imageKey}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Image API URL</label>
              <Input
                type="text"
                placeholder="https://yunwu.ai"
                value={tempImageUrl}
                onChange={(e) => {
                  setTempImageUrl(e.target.value)
                  if (errors.imageUrl) {
                    setErrors({ ...errors, imageUrl: '' })
                  }
                }}
                className="bg-input border-border"
              />
              {errors.imageUrl && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.imageUrl}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Image Model</label>
              <Input
                type="text"
                placeholder="e.g., gemini-2.5-flash-image-preview"
                value={tempImageModel}
                onChange={(e) => {
                  setTempImageModel(e.target.value)
                  if (errors.imageModel) {
                    setErrors({ ...errors, imageModel: '' })
                  }
                }}
                className="bg-input border-border"
              />
              {errors.imageModel && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.imageModel}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" className="bg-transparent" onClick={() => setOpen(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave}>
            {t.saveConfiguration}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
