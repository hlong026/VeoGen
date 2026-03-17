# 🚀 快速开始指南

## 新功能概览

你的应用现在支持：
- 🎬 **视频生成** - 使用 Veo API
- 🖼️ **图像生成** - 使用 Google Gemini API
- 🎨 **现代化设计** - 高端 SaaS 风格

## 安装和运行

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
编辑 `.env.local`：
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. 启动开发服务器
```bash
pnpm dev
```

打开 http://localhost:3000

## 配置 API

### 视频生成 API
1. 点击右上角 "API Settings"
2. 输入：
   - **API Key**: 你的 Veo API Key
   - **API Base URL**: https://api.mooerai.xyz
   - **Model**: veo3-fast-frames

### 图像生成 API
在同一对话框中配置：
- **Image Model**: gemini-2.5-flash-image-preview

## 使用方法

### 生成视频
1. 点击 "Video" 标签页
2. 输入视频描述
3. （可选）上传起始/结束帧
4. 点击 "Generate Video"
5. 等待完成

### 生成图像
1. 点击 "Image" 标签页
2. 输入图像描述
3. 点击 "Generate Image"
4. 等待完成
5. 点击 "Download Image"

## 文件结构

```
app/
├── page.tsx                    # 主页面（重新设计）
├── api/video/
│   ├── create/route.ts        # 创建视频
│   ├── query/route.ts         # 查询视频状态
│   └── history/route.ts       # 获取历史记录

components/video-gen/
├── image-preview.tsx          # 图像预览（新增）
├── image-upload.tsx           # 图像上传
├── api-config.tsx             # API 配置
├── video-preview.tsx          # 视频预览
└── generation-history.tsx     # 生成历史

lib/
├── image-generation-utils.ts  # 图像生成工具（新增）
├── api-utils.ts               # API 工具
├── types.ts                   # 类型定义
└── locale.tsx                 # 国际化
```

## 关键改进

### 设计
- ✅ 深色主题（Slate 950/900）
- ✅ 渐变按钮和背景
- ✅ 玻璃态效果
- ✅ 响应式布局

### 功能
- ✅ 视频生成
- ✅ 图像生成
- ✅ 标签页切换
- ✅ 实时预览

### 代码质量
- ✅ 完整的类型定义
- ✅ 错误处理
- ✅ 输入验证
- ✅ 无 linter 错误

## 常见问题

### Q: 如何获取 API Key？
A: 
- 视频: 访问 https://mooerai.xyz
- 图像: 访问 https://ai.google.dev

### Q: 图像生成失败怎么办？
A: 检查：
1. API Key 是否正确
2. 提示词是否过长（>2000字符）
3. 网络连接是否正常

### Q: 如何下载生成的内容？
A: 
- 视频: 点击预览中的 "Download Video"
- 图像: 点击预览中的 "Download Image"

## 技术栈

- **框架**: Next.js 16
- **UI**: React 19 + Tailwind CSS 4
- **组件**: shadcn/ui
- **数据库**: Supabase
- **API**: Veo + Google Gemini
- **状态**: React Hooks + SWR

## 部署

### Vercel
```bash
vercel deploy
```

### Docker
```bash
docker build -t veo-gen .
docker run -p 3000:3000 veo-gen
```

## 支持

遇到问题？
1. 查看 README.md
2. 查看 IMPROVEMENTS.md
3. 查看 DESIGN_UPDATE.md
4. 检查浏览器控制台错误

## 下一步

- [ ] 添加用户认证
- [ ] 实现图像编辑
- [ ] 添加批量生成
- [ ] 实现社区分享

祝你使用愉快！🎉
