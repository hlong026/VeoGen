-- Create video_generations table to store generation history
-- No authentication required - using session_id for anonymous users

CREATE TABLE IF NOT EXISTS public.video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  start_image_url TEXT,
  end_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT,
  enhanced_prompt TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_generations_session_id ON public.video_generations(session_id);

-- Create index on task_id for status polling
CREATE INDEX IF NOT EXISTS idx_video_generations_task_id ON public.video_generations(task_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON public.video_generations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (no auth required)
-- Since we're not using authentication, we allow all operations
CREATE POLICY "Allow all select" ON public.video_generations FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.video_generations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.video_generations FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.video_generations FOR DELETE USING (true);
