'use client'

import React from "react"

import { useCallback, useState } from 'react'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/locale'

type SingleImageUploadProps = {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  multiple?: false
}

type MultiImageUploadProps = {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  multiple: true
}

type ImageUploadProps = SingleImageUploadProps | MultiImageUploadProps

type ProcessedImage = {
  aspectRatio: number
  dataUrl: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_DIMENSION = 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function isMultiImageUploadProps(props: ImageUploadProps): props is MultiImageUploadProps {
  return props.multiple === true
}

export function ImageUpload(props: ImageUploadProps) {
  const { label, disabled } = props
  const [isDragging, setIsDragging] = useState(false)
  const [aspectRatios, setAspectRatios] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const { t } = useLocale()
  const isMultiple = isMultiImageUploadProps(props)
  const imageValues = isMultiple ? props.value : props.value ? [props.value] : []

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only PNG, JPG, and WebP images are allowed' }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size must be less than 10MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)` }
    }
    return { valid: true }
  }

  const processFile = useCallback((file: File): Promise<ProcessedImage> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      return Promise.reject(new Error(validation.error || 'Invalid file'))
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const base64 = e.target?.result as string
        const img = new Image()

        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_IMAGE_DIMENSION
              width = MAX_IMAGE_DIMENSION
            } else {
              width = (width / height) * MAX_IMAGE_DIMENSION
              height = MAX_IMAGE_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          resolve({
            aspectRatio: img.naturalWidth / img.naturalHeight,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          })
        }

        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }

        img.src = base64
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsDataURL(file)
    })
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      return
    }

    setError(null)

    try {
      const processedImages: ProcessedImage[] = []

      for (const file of files) {
        processedImages.push(await processFile(file))
      }

      if (isMultiImageUploadProps(props)) {
        props.onChange([...props.value, ...processedImages.map((image) => image.dataUrl)])
        setAspectRatios((prev) => [...prev, ...processedImages.map((image) => image.aspectRatio)])
        return
      }

      const firstImage = processedImages[0]

      if (!firstImage) {
        return
      }

      props.onChange(firstImage.dataUrl)
      setAspectRatios([firstImage.aspectRatio])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    }
  }, [processFile, props])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(isMultiple ? files : files.slice(0, 1))
  }, [handleFiles, isMultiple])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(isMultiple ? files : files.slice(0, 1))
    e.target.value = ''
  }

  const handleRemove = (index?: number) => {
    if (isMultiImageUploadProps(props)) {
      if (typeof index !== 'number') {
        return
      }

      props.onChange(props.value.filter((_, currentIndex) => currentIndex !== index))
      setAspectRatios((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
      setError(null)
      return
    }

    props.onChange(null)
    setAspectRatios([])
    setError(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>

      {isMultiple ? (
        <>
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
              accept={ALLOWED_TYPES.join(',')}
              multiple
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
                  {isDragging ? t.dropHere : imageValues.length > 0 ? '点击或拖拽继续添加图片' : t.clickOrDrag}
                </p>
                <p className="text-xs text-muted-foreground">
                  支持多张图片，{t.imageSize}
                </p>
              </div>
            </div>
          </label>
          {imageValues.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {imageValues.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative group rounded-lg overflow-hidden border border-border bg-card"
                  style={{ aspectRatio: aspectRatios[index] || 1 }}
                >
                  <img
                    src={image}
                    alt={`${label}-${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </>
      ) : imageValues[0] ? (
        <div
          className="relative group rounded-lg overflow-hidden border border-border bg-card"
          style={{ aspectRatio: aspectRatios[0] || 16 / 9 }}
        >
          <img
            src={imageValues[0] || "/placeholder.svg"}
            alt={label}
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={() => handleRemove()}
            disabled={disabled}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
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
              accept={ALLOWED_TYPES.join(',')}
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
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
