CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  lesson TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scores" ON public.scores FOR INSERT WITH CHECK (true);
CREATE INDEX scores_session_lesson_idx ON public.scores (session_id, lesson, created_at DESC);