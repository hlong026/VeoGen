'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, RotateCcw, Download } from 'lucide-react'
import { editImage } from '@/lib/image-generation-utils'

interface ImageEditorProps {
  imageUrl: string
  onSave: (editedImageUrl: string) => void
  onClose: () => void
  apiKey: string
  imageModel: string
}

export function ImageEditor({ imageUrl, onSave, onClose, apiKey, imageModel }: ImageEditorProps) {
  const [editPrompt, setEditPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)

  const handleEdit = async () => {
    if (!editPrompt.trim()) {
      setError('请输入编辑指令')
      return
    }

    setError(null)
    setIsEditing(true)

    try {
      const editedImageUrl = await editImage(editPrompt, imageUrl, apiKey, imageModel)
      onSave(editedImageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图像编辑失败')
    } finally {
      setIsEditing(false)
    }
  }

  const handleReset = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">编辑图像</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 图像预览 */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">预览</label>
            <div
              className="w-full aspect-square rounded-xl overflow-hidden border border-border bg-muted"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
              }}
            >
              <img src={imageUrl} alt="预览" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* 调整参数 */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">亮度</label>
                <span className="text-xs text-muted-foreground">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={(v) => setBrightness(v[0])}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">对比度</label>
                <span className="text-xs text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={(v) => setContrast(v[0])}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">饱和度</label>
                <span className="text-xs text-muted-foreground">{saturation}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={(v) => setSaturation(v[0])}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* 编辑指令 */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">编辑指令</label>
            <Textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="例如：添加蓝色背景、改变颜色为红色、添加更多细节"
              className="min-h-[100px] resize-none"
              disabled={isEditing}
            />
            <p className="text-xs text-muted-foreground">
              描述你想对图像进行的更改
            </p>
          </div>

          {/* 错误消息 */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              disabled={isEditing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isEditing}
            >
              取消
            </Button>
            <Button
              onClick={handleEdit}
              className="flex-1"
              disabled={isEditing || !editPrompt.trim()}
            >
              {isEditing ? '编辑中...' : '应用编辑'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
