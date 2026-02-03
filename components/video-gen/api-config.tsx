'use client'

import { useState } from 'react'
import { Settings, Eye, EyeOff, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  apiKey: string
  apiBaseUrl: string
  model: string
  onApiKeyChange: (value: string) => void
  onApiBaseUrlChange: (value: string) => void
  onModelChange: (value: string) => void
}

export function ApiConfig({
  apiKey,
  apiBaseUrl,
  model,
  onApiKeyChange,
  onApiBaseUrlChange,
  onModelChange,
}: ApiConfigProps) {
  const [showKey, setShowKey] = useState(false)
  const [open, setOpen] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)
  const [tempUrl, setTempUrl] = useState(apiBaseUrl)
  const [tempModel, setTempModel] = useState(model)
  const { t } = useLocale()

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTempKey(apiKey)
      setTempUrl(apiBaseUrl)
      setTempModel(model)
    }
    setOpen(isOpen)
  }

  const handleSave = () => {
    onApiKeyChange(tempKey)
    onApiBaseUrlChange(tempUrl)
    onModelChange(tempModel)
    setOpen(false)
  }

  const isConfigured = apiKey.length > 0

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
            {t.apiConfigDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t.apiKey}</label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder={t.enterApiKey}
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
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
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t.apiBaseUrl}</label>
            <Input
              type="text"
              placeholder="https://yunwu.ai"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground">
              {t.defaultUrl}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t.model}</label>
            <Input
              type="text"
              placeholder={t.modelPlaceholder}
              value={tempModel}
              onChange={(e) => setTempModel(e.target.value)}
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground">
              {t.modelHint}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
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
