'use client'

import { useState } from 'react'
import { Loader2, Wand2, Download, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from './image-upload'

interface ImageGenerationPageProps {
  apiKey: string
  imageModel: string
  onGenerateImage: (prompt: string, config: ImageGenerationConfig) => Promise<string>
  theme: 'light' | 'dark'
}

export interface ImageGenerationConfig {
  aspectRatio: string
  imageSize: string
  responseModalities: string[]
  referenceImages?: string[]
}

export function ImageGenerationPage({
  apiKey,
  imageModel,
  onGenerateImage,
  theme,
}: ImageGenerationPageProps) {
  const [mode, setMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image')
  const [prompt, setPrompt] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [imageSize, setImageSize] = useState('1K')

  const cardBg = theme === 'dark' ? 'bg-slate-900/80 border-slate-800/50' : 'bg-white/80 border-slate-200/50'
  const inputBg = theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/90 border-slate-300/50'
  const inputText = theme === 'dark' ? 'text-slate-100 placeholder-slate-500' : 'text-slate-950 placeholder-slate-600'

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入描述')
      return
    }

    if (mode === 'image-to-image' && uploadedImages.length === 0) {
      setError('请至少上传一张图像')
      return
    }

    if (!apiKey) {
      setError('请先配置 API 密钥')
      return
    }

    if (prompt.length > 2000) {
      setError('描述不能超过 2000 个字符')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const config: ImageGenerationConfig = {
        aspectRatio,
        imageSize,
        responseModalities: ['IMAGE'],
        referenceImages: mode === 'image-to-image' ? uploadedImages : [],
      }

      const imageUrl = await onGenerateImage(prompt, config)
      setGeneratedImage(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-6">
      {/* 左侧：表单区域 */}
      <div className="lg:w-[480px] flex-shrink-0 space-y-6">
        {/* 模式选择 */}
        <div className={`p-6 rounded-2xl border backdrop-blur-sm ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">生成模式</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'text-to-image', label: '📝 文生图' },
              { id: 'image-to-image', label: '🖼️ 图生图' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`p-3 rounded-lg transition-all duration-300 font-medium ${
                  mode === m.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : theme === 'dark'
                    ? 'bg-slate-800/50 hover:bg-slate-700/50'
                    : 'bg-slate-100/50 hover:bg-slate-200/50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 图像上传 */}
        {mode === 'image-to-image' && (
          <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${cardBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-pink-500" />
              <h3 className="font-semibold">上传图像</h3>
            </div>
            <ImageUpload label="选择图像" value={uploadedImages} onChange={setUploadedImages} disabled={isGenerating} multiple />
          </div>
        )}

        {/* 提示词 */}
        <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">{mode === 'text-to-image' ? '图像描述' : '编辑指令'}</h3>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === 'text-to-image' ? '描述你想要的图像...' : '描述你想要的编辑...'}
            className={`min-h-[140px] resize-none rounded-xl ${inputBg} ${inputText} focus:ring-2 focus:ring-purple-500`}
            disabled={isGenerating}
          />
          <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {prompt.length} / 2000
          </div>
        </div>

        {/* 配置 */}
        <div className={`p-6 rounded-2xl border backdrop-blur-sm ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h3 className="font-semibold">图像配置</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-2">宽高比</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                <SelectTrigger className={`rounded-lg ${inputBg}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: '1:1', label: '1:1 正方形' },
                    { value: '9:16', label: '9:16 竖屏' },
                    { value: '16:9', label: '16:9 横屏' },
                    { value: '3:4', label: '3:4 竖长' },
                    { value: '4:3', label: '4:3 横长' },
                    { value: '21:9', label: '21:9 超宽' },
                  ].map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-2">分辨率</label>
              <Select value={imageSize} onValueChange={setImageSize} disabled={isGenerating}>
                <SelectTrigger className={`rounded-lg ${inputBg}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: '1K', label: '1K 标准' },
                    { value: '2K', label: '2K 高清' },
                    { value: '4K', label: '4K 超清' },
                  ].map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey || !prompt.trim() || (mode === 'image-to-image' && uploadedImages.length === 0)}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              生成图像
            </>
          )}
        </Button>
      </div>

      {/* 右侧：预览区域 */}
      <div className="flex-1 min-h-[600px]">
        <div className={`h-full p-6 rounded-2xl border backdrop-blur-sm flex flex-col ${cardBg}`}>
          <h3 className="font-semibold mb-4">预览</h3>

          <div className={`relative rounded-xl overflow-hidden border-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-300/50'} flex-1 flex items-center justify-center mb-4`}>
            {!generatedImage && !isGenerating && (
              <div className="text-center">
                <Wand2 className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  输入描述并生成
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className={`absolute inset-0 rounded-full border-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`} />
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  生成中...
                </p>
              </div>
            )}

            {generatedImage && !isGenerating && (
              <img src={generatedImage} alt="生成的图像" className="w-full h-full object-cover" />
            )}
          </div>

          {generatedImage && !isGenerating && (
            <Button asChild className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20">
              <a href={generatedImage} download="生成的图像.png">
                <Download className="w-4 h-4 mr-2" />
                下载图像
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
