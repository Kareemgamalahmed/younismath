DROP POLICY "Anyone can insert scores" ON public.scores;
CREATE POLICY "Anyone can insert valid scores" ON public.scores FOR INSERT
WITH CHECK (
  lesson IN ('math_add','math_compare','arabic')
  AND correct >= 0
  AND total >= 0
  AND length(session_id) BETWEEN 1 AND 64
);