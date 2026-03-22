# VeoGen - AI Video Generation Platform

A modern web application for generating videos using AI models. Built with Next.js, React, and Supabase.

## Features

- 🎬 AI-powered video generation
- 🖼️ AI image generation with text-to-image and multi-image image-to-image
- 🖼️ Support for start and end frame images
- ✨ Prompt enhancement with AI
- 📱 Responsive design (desktop and mobile)
- 🌍 Multi-language support (English & Chinese)
- 💾 Generation history tracking
- 🎨 Dark/Light theme support

## Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Veo API credentials (from mooerai.xyz or compatible provider)

## Setup

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Execute the SQL migration to create the required table:

```sql
-- Run the script from scripts/001_create_video_generations.sql
-- in your Supabase SQL editor
```

Or manually create the table:

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

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### API Configuration

1. Click the **API Settings** button in the header
2. Enter your API credentials:
   - **API Key**: Your Veo API key
   - **API Base URL**: The API endpoint (default: https://api.mooerai.xyz)
   - **Model**: The model to use (e.g., veo3-fast-frames)
3. Click **Save Configuration**

Your settings are saved locally in the browser.

### Generate a Video

1. (Optional) Upload start and end frame images
2. Enter a detailed prompt describing the video you want to generate
3. Toggle "Enhance prompt with AI" if desired
4. Click **Generate Video**
5. Wait for the video to be generated (may take several minutes)
6. Download or view the generated video

### Generate an Image

1. Switch to the **Image** tab
2. Choose **Text-to-Image** or **Image-to-Image** mode
3. In **Image-to-Image** mode, upload one or more reference images
4. Enter the image description or edit instruction
5. Adjust aspect ratio and resolution if needed
6. Click **Generate Image** and download the result after generation

### View History

Click the **Generation History** button to see all your previous generations with:
- Original and enhanced prompts
- Start/end frame images
- Generated videos
- Generation status and timestamps

## API Endpoints

### POST /api/video/create

Create a new video generation task.

**Request:**
```json
{
  "model": "veo3-fast-frames",
  "prompt": "A majestic eagle soaring through clouds",
  "images": ["base64_image_1", "base64_image_2"],
  "enhance_prompt": true,
  "apiKey": "your_api_key",
  "apiBaseUrl": "https://api.mooerai.xyz"
}
```

**Response:**
```json
{
  "id": "task_id",
  "status": "pending",
  "video_url": null,
  "enhanced_prompt": "Enhanced prompt text"
}
```

### GET /api/video/query

Query the status of a video generation task.

**Query Parameters:**
- `id`: Task ID
- `apiKey`: Your API key
- `apiBaseUrl`: API base URL

**Response:**
```json
{
  "id": "task_id",
  "status": "processing",
  "video_url": null,
  "enhanced_prompt": "Enhanced prompt text"
}
```

### GET /api/video/history

Get the generation history.

**Response:**
```json
[
  {
    "id": "uuid",
    "task_id": "task_id",
    "model": "veo3-fast-frames",
    "prompt": "Original prompt",
    "first_image": "base64_image",
    "last_image": null,
    "status": "completed",
    "video_url": "https://...",
    "enhanced_prompt": "Enhanced prompt",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:05:00Z"
  }
]
```

## Configuration

### Polling Settings

The application polls for video generation status with the following settings:

- **Poll Interval**: 5 seconds
- **Max Attempts**: 120 (10 minutes total)
- **Timeout Message**: "Video generation timeout - please check the history for updates"

### Image Constraints

- **Max File Size**: 10MB
- **Max Dimension**: 1024px (scaled proportionally)
- **Supported Formats**: PNG, JPG, WebP
- **Compression**: JPEG at 80% quality

### Prompt Constraints

- **Max Length**: 2000 characters

## Troubleshooting

### "API Key is required"
- Click API Settings and enter your API key
- Ensure the key is valid and has appropriate permissions

### "Video generation timeout"
- The generation took longer than 10 minutes
- Check the Generation History to see if the video was eventually generated
- Try with a simpler prompt

### "Invalid API response"
- Verify your API Base URL is correct
- Check that your API key is valid
- Ensure the model name is supported by your API provider

### Images not uploading
- Check file size (max 10MB)
- Verify file format (PNG, JPG, or WebP)
- Try a different image

## Development

### Project Structure

```
├── app/
│   ├── api/video/          # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── ui/                 # UI components (shadcn/ui)
│   └── video-gen/          # Feature components
├── lib/
│   ├── api-utils.ts        # API utilities
│   ├── locale.tsx          # i18n setup
│   ├── supabase/           # Supabase clients
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

### Building for Production

```bash
pnpm build
pnpm start
```

## Technologies

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Hooks + SWR
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Internationalization**: Custom i18n

## License

MIT

## Support

For issues or questions, please check:
1. The troubleshooting section above
2. Your API provider's documentation
3. Supabase documentation at https://supabase.com/docs
