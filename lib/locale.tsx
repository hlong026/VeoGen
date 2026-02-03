'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Locale = 'en' | 'zh'

const translations = {
  en: {
    // Header
    appName: 'VeoGen',
    appDescription: 'AI Video Generation',
    
    // API Config
    apiSettings: 'API Settings',
    apiConfiguration: 'API Configuration',
    apiConfigDescription: 'Configure your Veo API credentials to generate videos.',
    apiKey: 'API Key',
    enterApiKey: 'Enter your API key',
    apiBaseUrl: 'API Base URL',
    defaultUrl: 'Default: https://yunwu.ai',
    cancel: 'Cancel',
    saveConfiguration: 'Save Configuration',
    
    // Model Input
    model: 'Model',
    modelPlaceholder: 'e.g., veo3-fast-frames',
    modelHint: 'Enter the model name you want to use',
    
    // Image Upload
    startFrame: 'Start Frame (Optional)',
    endFrame: 'End Frame (Optional)',
    endFrameNotSupported: 'This model only supports start frame',
    clickOrDrag: 'Click or drag to upload',
    dropHere: 'Drop image here',
    imageSize: 'PNG, JPG up to 10MB',
    
    // Generation Form
    createVideo: 'Create Video',
    prompt: 'Prompt',
    promptPlaceholder: 'Describe the video you want to generate... e.g., "A majestic eagle soaring through golden clouds at sunset, cinematic lighting"',
    enhancePrompt: 'Enhance prompt with AI',
    generateVideo: 'Generate Video',
    generating: 'Generating...',
    configureApiFirst: 'Please configure your API key first',
    enterPrompt: 'Please enter a prompt',
    
    // Video Preview
    preview: 'Preview',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    idle: 'Idle',
    videoWillAppear: 'Your generated video will appear here',
    initializing: 'Initializing...',
    generatingVideo: 'Generating video...',
    mayTakeFewMinutes: 'This may take a few minutes',
    generationFailed: 'Generation Failed',
    enhancedPrompt: 'Enhanced Prompt',
    openInNewTab: 'Open in New Tab',
    downloadVideo: 'Download Video',
    
    // Generation History
    generationHistory: 'Generation History',
    refresh: 'Refresh',
    noGenerationsYet: 'No generations yet',
    generationsWillAppear: 'Your video generations will appear here',
    fullPrompt: 'Full Prompt',
    generatedVideo: 'Generated Video',
    open: 'Open',
    download: 'Download',
    
    // Theme & Language
    lightMode: 'Light',
    darkMode: 'Dark',
    language: 'Language',
    theme: 'Theme',
  },
  zh: {
    // Header
    appName: 'VeoGen',
    appDescription: 'AI 视频生成',
    
    // API Config
    apiSettings: 'API 设置',
    apiConfiguration: 'API 配置',
    apiConfigDescription: '配置您的 Veo API 凭据以生成视频。',
    apiKey: 'API 密钥',
    enterApiKey: '输入您的 API 密钥',
    apiBaseUrl: 'API 基础 URL',
    defaultUrl: '默认: https://yunwu.ai',
    cancel: '取消',
    saveConfiguration: '保存配置',
    
    // Model Input
    model: '模型',
    modelPlaceholder: '例如: veo3-fast-frames',
    modelHint: '输入您想使用的模型名称',
    
    // Image Upload
    startFrame: '起始帧 (可选)',
    endFrame: '结束帧 (可选)',
    endFrameNotSupported: '此模型仅支持起始帧',
    clickOrDrag: '点击或拖拽上传',
    dropHere: '拖放图片到这里',
    imageSize: 'PNG, JPG 最大 10MB',
    
    // Generation Form
    createVideo: '创建视频',
    prompt: '提示词',
    promptPlaceholder: '描述您想要生成的视频... 例如："一只雄鹰在日落时分金色云层中翱翔，电影级光影"',
    enhancePrompt: '使用 AI 增强提示词',
    generateVideo: '生成视频',
    generating: '生成中...',
    configureApiFirst: '请先配置您的 API 密钥',
    enterPrompt: '请输入提示词',
    
    // Video Preview
    preview: '预览',
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    idle: '空闲',
    videoWillAppear: '生成的视频将显示在这里',
    initializing: '初始化中...',
    generatingVideo: '视频生成中...',
    mayTakeFewMinutes: '这可能需要几分钟',
    generationFailed: '生成失败',
    enhancedPrompt: '增强后的提示词',
    openInNewTab: '在新标签页打开',
    downloadVideo: '下载视频',
    
    // Generation History
    generationHistory: '生成历史',
    refresh: '刷新',
    noGenerationsYet: '暂无生成记录',
    generationsWillAppear: '您的视频生成记录将显示在这里',
    fullPrompt: '完整提示词',
    generatedVideo: '生成的视频',
    open: '打开',
    download: '下载',
    
    // Theme & Language
    lightMode: '浅色',
    darkMode: '深色',
    language: '语言',
    theme: '主题',
  },
}

type Translations = typeof translations.en

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('veo-locale') as Locale
    if (saved && (saved === 'en' || saved === 'zh')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('veo-locale', newLocale)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
