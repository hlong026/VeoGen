# 🔧 数据库连接故障排查指南

## 问题描述

```
[HISTORY] Database error: TypeError: fetch failed
GET /api/video/history 500
```

这个错误表示无法连接到 Supabase 数据库。

## 🔍 排查步骤

### 1. 检查环境变量

首先验证 `.env.local` 文件中的配置：

```bash
# 检查文件是否存在
ls -la .env.local

# 查看内容（不要提交到 Git）
cat .env.local
```

应该包含：
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

### 2. 验证 Supabase 项目

1. 访问 https://supabase.com
2. 登录你的账户
3. 选择项目
4. 在 Settings → API 中找到：
   - Project URL
   - Anon Key (public)

### 3. 检查网络连接

```bash
# 测试 Supabase 连接
curl -I https://xxxxx.supabase.co

# 应该返回 200 或 301
```

### 4. 验证数据库表

1. 在 Supabase 控制台中
2. 进入 SQL Editor
3. 运行：
```sql
SELECT * FROM video_generations LIMIT 1;
```

如果表不存在，运行：
```sql
CREATE TABLE video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  first_image TEXT,
  last_image TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT,
  enhanced_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_video_generations_task_id ON video_generations(task_id);
CREATE INDEX idx_video_generations_created_at ON video_generations(created_at DESC);
```

### 5. 检查浏览器控制台

打开浏览器开发者工具 (F12)：

1. 进入 Console 标签
2. 查看是否有错误信息
3. 进入 Network 标签
4. 查看 `/api/video/history` 请求
5. 检查响应内容

### 6. 检查 Next.js 日志

在终端中查看完整的错误信息：

```
[HISTORY] Database error: TypeError: fetch failed
```

这通常表示：
- 网络连接问题
- DNS 解析失败
- Supabase 服务不可用
- 环境变量配置错误

## 🛠️ 常见解决方案

### 解决方案 1: 重新启动开发服务器

```bash
# 停止服务器 (Ctrl+C)
# 清除缓存
rm -rf .next

# 重新启动
pnpm dev
```

### 解决方案 2: 更新环境变量

1. 复制正确的 Supabase 凭证
2. 更新 `.env.local`
3. 重启开发服务器

### 解决方案 3: 检查网络

```bash
# 测试网络连接
ping 8.8.8.8

# 测试 DNS
nslookup supabase.com

# 测试 Supabase 连接
curl https://xxxxx.supabase.co/rest/v1/
```

### 解决方案 4: 检查防火墙

如果在公司网络中：
- 检查是否有代理设置
- 检查防火墙是否阻止了 HTTPS 连接
- 尝试使用 VPN

### 解决方案 5: 创建新的 Supabase 项目

如果以上都不行：
1. 在 Supabase 创建新项目
2. 获取新的 URL 和 Key
3. 更新 `.env.local`
4. 创建数据库表
5. 重启开发服务器

## 📋 完整检查清单

- [ ] `.env.local` 文件存在
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 正确
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 正确
- [ ] Supabase 项目在线
- [ ] 数据库表存在
- [ ] 网络连接正常
- [ ] 防火墙允许连接
- [ ] 开发服务器已重启

## 🔄 自动重试机制

新版本已添加自动重试机制：
- 最多重试 3 次
- 每次重试延迟 1000ms
- 指数退避（延迟递增）

如果仍然失败，检查上述步骤。

## 📞 获取帮助

### 检查日志

```bash
# 查看完整的错误信息
# 在终端中查看 [HISTORY] 开头的日志
```

### 验证配置

```bash
# 检查环境变量是否被正确加载
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### 测试连接

```bash
# 创建测试脚本
cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', url)
console.log('Key:', key ? 'configured' : 'missing')

const supabase = createClient(url, key)
supabase.from('video_generations').select('count').then(r => {
  console.log('Connection:', r.error ? 'FAILED' : 'SUCCESS')
  console.log('Error:', r.error?.message)
})
EOF

node test-supabase.js
```

## 🚀 恢复步骤

1. **验证配置** - 确保环境变量正确
2. **重启服务** - 停止并重新启动开发服务器
3. **清除缓存** - 删除 `.next` 目录
4. **检查日志** - 查看完整的错误信息
5. **测试连接** - 使用上述测试脚本

## ✅ 验证修复

修复后，应该看到：

```
[HISTORY] Fetching history (attempt 1/3)
[HISTORY] Success, returning X records
GET /api/video/history 200
```

而不是：

```
[HISTORY] Database error: TypeError: fetch failed
GET /api/video/history 500
```

---

如果问题仍未解决，请：
1. 收集完整的错误日志
2. 检查 Supabase 服务状态
3. 联系 Supabase 支持
