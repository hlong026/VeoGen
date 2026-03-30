'use client'
import{useState,useEffect,useCallback,useRef}from'react'
import useSWR,{mutate}from'swr'
import{Sparkles,History,Moon,Sun,Settings,Menu,X}from'lucide-react'
import{Button}from'@/components/ui/button'
import{Tabs,TabsContent,TabsList,TabsTrigger}from'@/components/ui/tabs'
import{Sheet,SheetContent,SheetHeader,SheetTitle,SheetTrigger}from'@/components/ui/sheet'
import{ApiConfig}from'@/components/video-gen/api-config'
import{GenerationHistory}from'@/components/video-gen/generation-history'
import{SettingsPanel}from'@/components/video-gen/settings-panel'
import{ImageGenerationPage}from'@/components/video-gen/image-generation-page'
import{VideoGenerationPage}from'@/components/video-gen/video-generation-page'
import{generateImage}from'@/lib/image-generation-utils'
import type{VideoGenerationBatch}from'@/lib/types'
import{useLocale}from'@/lib/locale'
const f=(url:string)=>fetch(url).then(r=>r.json())
export function MainApp(){const{t}=useLocale()
const[theme,setTheme]=useState<'light'|'dark'>('dark')
const[vk,setVk]=useState('')
const[ik,setIk]=useState('')
const[vu,setVu]=useState('https://api.mooerai.xyz')
const[iu,setIu]=useState('https://yunwu.ai')
const[vm,setVm]=useState('veo3-fast-frames')
const[im,setIm]=useState('gemini-2.5-flash-image-preview')
const[mode,setMode]=useState<'video'|'image'>('video')
const[mobileMenuOpen,setMobileMenuOpen]=useState(false)
const{data:h=[],isLoading:hl}=useSWR<VideoGenerationBatch[]>('/api/video/history',f,{refreshInterval:30000})
useEffect(()=>{const t=localStorage.getItem('veo-theme')as'light'|'dark'||'dark'
setTheme(t)
document.documentElement.classList.toggle('dark',t==='dark')
document.documentElement.classList.toggle('light',t==='light')
const vk=localStorage.getItem('veo-video-api-key')
const ik=localStorage.getItem('veo-image-api-key')
const vu=localStorage.getItem('veo-video-api-url')
const iu=localStorage.getItem('veo-image-api-url')
const vm=localStorage.getItem('veo-video-model')
const im=localStorage.getItem('veo-image-model')
if(vk)setVk(vk)
if(ik)setIk(ik)
if(vu)setVu(vu)
if(iu)setIu(iu)
if(vm)setVm(vm)
if(im)setIm(im)},[])
const tg=()=>{const nt=theme==='dark'?'light':'dark'
setTheme(nt)
localStorage.setItem('veo-theme',nt)
document.documentElement.classList.toggle('dark',nt==='dark')
document.documentElement.classList.toggle('light',nt==='light')}
const bg=theme==='dark'?'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950':'bg-gradient-to-br from-white via-slate-50 to-white'
const txt=theme==='dark'?'text-slate-50':'text-slate-950'
const brd=theme==='dark'?'border-slate-800/50':'border-slate-200/50'
const headerBg=theme==='dark'?'bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/50':'bg-white/40 backdrop-blur-xl border-b border-slate-200/50'
return(<div className={`min-h-screen ${bg}`}><header className={`sticky top-0 z-50 ${headerBg}`}><div className="px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-20"><div className="flex items-center gap-4"><div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/20"><Sparkles className="w-6 h-6 text-white"/></div><div className="hidden sm:block"><h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">VeoGen</h1><p className={`text-xs ${theme==='dark'?'text-slate-400':'text-slate-600'}`}>AI 内容生成平台</p></div></div><div className="flex items-center gap-3 ml-auto"><button onClick={tg} className={`p-2.5 rounded-xl transition-all duration-300 ${theme==='dark'?'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300':'bg-slate-200/50 hover:bg-slate-300/50 text-slate-700'}`}>{theme==='dark'?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}</button><Sheet><SheetTrigger asChild><Button variant="ghost" size="sm" className={`gap-2 ${theme==='dark'?'hover:bg-slate-800/50':'hover:bg-slate-200/50'}`}><History className="w-4 h-4"/><span className="hidden sm:inline text-sm">历史</span></Button></SheetTrigger><SheetContent side="right" className={`w-full sm:max-w-lg p-0 ${theme==='dark'?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><SheetHeader className={`px-6 py-4 border-b ${brd}`}><SheetTitle>生成历史</SheetTitle></SheetHeader><div className="h-[calc(100vh-73px)] overflow-hidden"><GenerationHistory history={h} onRefresh={()=>mutate('/api/video/history')} loading={hl}/></div></SheetContent></Sheet><SettingsPanel/><ApiConfig videoApiKey={vk} imageApiKey={ik} videoApiUrl={vu} imageApiUrl={iu} videoModel={vm} imageModel={im} onVideoApiKeyChange={(v)=>{setVk(v)
localStorage.setItem('veo-video-api-key',v)}} onImageApiKeyChange={(v)=>{setIk(v)
localStorage.setItem('veo-image-api-key',v)}} onVideoApiUrlChange={(v)=>{setVu(v)
localStorage.setItem('veo-video-api-url',v)}} onImageApiUrlChange={(v)=>{setIu(v)
localStorage.setItem('veo-image-api-url',v)}} onVideoModelChange={(v)=>{setVm(v)
localStorage.setItem('veo-video-model',v)}} onImageModelChange={(v)=>{setIm(v)
localStorage.setItem('veo-image-model',v)}}/></div></div></div></header><main className="flex-1 overflow-hidden"><Tabs value={mode} onValueChange={(v)=>setMode(v as'video'|'image')} className="h-[calc(100vh-80px)]"><div className="flex flex-col h-full"><div className={`border-b ${brd} px-4 sm:px-6 lg:px-8 py-4`}><TabsList className={`grid w-full max-w-xs grid-cols-2 rounded-xl p-1 ${theme==='dark'?'bg-slate-800/50':'bg-slate-200/50'}`}><TabsTrigger value="video" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg">🎬 视频</TabsTrigger><TabsTrigger value="image" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg">🖼️ 图像</TabsTrigger></TabsList></div><div className="flex-1 overflow-y-auto"><TabsContent value="video" className="h-full m-0"><VideoGenerationPage apiKey={vk} videoModel={vm} apiBaseUrl={vu} theme={theme}/></TabsContent><TabsContent value="image" className="h-full m-0"><ImageGenerationPage apiKey={ik} imageModel={im} onGenerateImage={async(p,c)=>{try{const url=await generateImage(p,ik,im,c)
return url}catch(e){throw e}}} theme={theme}/></TabsContent></div></div></Tabs></main></div>)
}
