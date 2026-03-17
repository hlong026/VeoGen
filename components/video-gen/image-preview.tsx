'use client'

import { Download, AlertCircle, Loader2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ImagePreviewProps {
  imageUrl: string | null
  isLoading: boolean
  error: string | null
  onEdit?: (imageUrl: string) => void
  apiKey?: string
  imageModel?: string
}

export function ImagePreview({ imageUrl, isLoading, error, onEdit, apiKey, imageModel }: ImagePreviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-200">预览</h2>

      <div className="relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700 aspect-square">
        {!imageUrl && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm">生成的图像将显示在这里</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-600" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-sm text-slate-300">正在生成图像...</p>
          </div>
        )}

        {imageUrl && !isLoading && (
          <img
            src={imageUrl}
            alt="生成的图像"
            className="w-full h-full object-cover"
          />
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-sm text-red-400 text-center px-4">{error}</p>
          </div>
        )}
      </div>

      {imageUrl && !isLoading && (
        <div className="flex gap-2 flex-col sm:flex-row">
          {onEdit && apiKey && imageModel && (
            <Button
              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
              onClick={() => onEdit(imageUrl)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              编辑图像
            </Button>
          )}
          <Button
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            asChild
          >
            <a href={imageUrl} download="生成的图像.jpg">
              <Download className="w-4 h-4 mr-2" />
              下载
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
