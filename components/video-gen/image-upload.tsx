'use client'

import React from "react"

import { useCallback, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/locale'

interface ImageUploadProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

export function ImageUpload({ label, value, onChange, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const { t } = useLocale()

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      // 获取图片尺寸
      const img = new Image()
      img.onload = () => {
        setAspectRatio(img.width / img.height)
      }
      img.src = base64
      onChange(base64)
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    onChange(null)
    setAspectRatio(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {value ? (
        <div 
          className="relative group rounded-lg overflow-hidden border border-border bg-card"
          style={{ aspectRatio: aspectRatio || 16/9 }}
        >
          <img
            src={value || "/placeholder.svg"}
            alt={label}
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all min-h-[120px]',
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-muted-foreground hover:bg-muted/30',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={disabled}
            className="sr-only"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 rounded-full bg-muted">
              {isDragging ? (
                <Upload className="w-5 h-5 text-primary" />
              ) : (
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? t.dropHere : t.clickOrDrag}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.imageSize}
              </p>
            </div>
          </div>
        </label>
      )}
    </div>
  )
}
