-- Create video_generations table to store generation history
-- Run this in Supabase SQL Editor

-- Drop existing table if needed (WARNING: this will delete all data)
DROP TABLE IF EXISTS public.video_generations;

-- Create table with correct column names
CREATE TABLE public.video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  first_image TEXT,
  last_image TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT,
  enhanced_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_video_generations_task_id ON public.video_generations(task_id);
CREATE INDEX idx_video_generations_created_at ON public.video_generations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth required)
CREATE POLICY "Allow all" ON public.video_generations FOR ALL USING (true) WITH CHECK (true);
