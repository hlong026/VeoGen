ALTER TABLE public.video_generations
  ADD COLUMN IF NOT EXISTS batch_id TEXT,
  ADD COLUMN IF NOT EXISTS batch_index INTEGER,
  ADD COLUMN IF NOT EXISTS batch_total INTEGER;

CREATE INDEX IF NOT EXISTS idx_video_generations_batch_id
  ON public.video_generations(batch_id);
