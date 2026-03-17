# 🔧 图像生成 API 调试指南

## 📋 问题描述

图像生成API返回 "No image data in response" 错误，需要调试API响应格式。

## 🔍 调试方法

### 方法 1：查看浏览器控制台日志

1. 打开浏览器开发者工具 (F12)
2. 进入 "Console" 标签页
3. 尝试生成图像
4. 查看以下日志：

```
[IMAGE_GEN] 请求参数: {...}
[IMAGE_GEN] 请求体: {...}
[IMAGE_GEN] 响应状态: 200
[IMAGE_GEN] 响应格式: {...}
[IMAGE_GEN] 成功生成图像，数据大小: 12345
```

### 方法 2：查看网络请求

1. 打开浏览器开发者工具 (F12)
2. 进入 "Network" 标签页
3. 尝试生成图像
4. 找到 `generateContent` 请求
5. 查看：
   - **Request**: 请求体格式
   - **Response**: 响应格式

### 方法 3：查看完整响应

如果出现错误，控制台会打印完整的响应格式：

```
[IMAGE_GEN] 完整响应: {
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inline_data": {
              "mime_type": "image/jpeg",
              "data": "base64_encoded_image_data"
            }
          }
        ]
      }
    }
  ]
}
```

## 📝 请求格式

### 文生图请求

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "HA [style] sticker of a [subject], featuring [key characteristics] and a [color palette]. The design should have [line style] and [shading style]. The background must be transparent."
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": {
      "aspectRatio": "9:16",
      "imageSize": "1K"
    }
  }
}
```

### 图生图请求

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Turn this rough [medium] sketch of a [subject] into a [style description] photo. Keep the [specific features] from the sketch but add [new details/materials]."
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "base64_encoded_image_data"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": {
      "aspectRatio": "9:16",
      "imageSize": "1K"
    }
  }
}
```

## 📊 响应格式

### 成功响应

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inline_data": {
              "mime_type": "image/jpeg",
              "data": "base64_encoded_image_data_here"
            }
          }
        ]
      }
    }
  ]
}
```

### 错误响应

```json
{
  "error": {
    "code": 400,
    "message": "Invalid request",
    "status": "INVALID_ARGUMENT"
  }
}
```

## 🐛 常见问题

### 问题 1：No image data in response

**原因**: 响应中没有找到图像数据

**解决方案**:
1. 检查浏览器控制台的完整响应
2. 确认 API 密钥是否正确
3. 确认 API URL 是否正确
4. 检查提示词是否有效

### 问题 2：401 Unauthorized

**原因**: API 密钥无效或过期

**解决方案**:
1. 检查 API 密钥是否正确
2. 重新生成 API 密钥
3. 确认 API 密钥有权限

### 问题 3：400 Bad Request

**原因**: 请求格式错误

**解决方案**:
1. 检查请求体格式
2. 确认所有必需字段都已填写
3. 检查 JSON 格式是否正确

### 问题 4：500 Internal Server Error

**原因**: 服务器错误

**解决方案**:
1. 稍后重试
2. 检查 API 服务状态
3. 联系 API 提供商

## 🔧 调试步骤

### 步骤 1：启用日志

代码已包含详细的日志记录：

```typescript
console.log('[IMAGE_GEN] 请求参数:', {...})
console.log('[IMAGE_GEN] 请求体:', {...})
console.log('[IMAGE_GEN] 响应状态:', response.status)
console.log('[IMAGE_GEN] 响应格式:', {...})
console.log('[IMAGE_GEN] 成功生成图像，数据大小:', imageData.length)
```

### 步骤 2：查看浏览器控制台

1. 打开 F12 开发者工具
2. 进入 Console 标签页
3. 尝试生成图像
4. 查看所有 `[IMAGE_GEN]` 日志

### 步骤 3：检查网络请求

1. 进入 Network 标签页
2. 找到 `generateContent` 请求
3. 查看 Request 和 Response

### 步骤 4：分析响应

根据响应格式判断问题：
- 如果有 `error` 字段 → API 错误
- 如果没有 `candidates` → 响应格式错误
- 如果没有 `inline_data` → 图像数据缺失

## 📞 获取帮助

### 检查清单

- [ ] API 密钥是否正确？
- [ ] API URL 是否正确？
- [ ] 网络连接是否正常？
- [ ] 提示词是否有效？
- [ ] 浏览器控制台是否有错误？
- [ ] 网络请求是否成功（200 状态码）？

### 收集信息

如果需要帮助，请收集以下信息：

1. **浏览器控制台日志** - 复制所有 `[IMAGE_GEN]` 日志
2. **网络请求** - 导出 Network 标签页的请求
3. **错误信息** - 完整的错误消息
4. **API 配置** - API URL 和模型名称

## 🎯 验证修复

修复后，应该看到：

```
[IMAGE_GEN] 请求参数: {...}
[IMAGE_GEN] 请求体: {...}
[IMAGE_GEN] 响应状态: 200
[IMAGE_GEN] 响应格式: {...}
[IMAGE_GEN] 成功生成图像，数据大小: 12345
```

而不是：

```
[IMAGE_GEN] 错误响应: {...}
[IMAGE_GEN] 响应中没有找到图像数据
```

---

**更新日期**: 2026年3月18日

**版本**: 1.0.0

**状态**: ✅ 调试指南完成
