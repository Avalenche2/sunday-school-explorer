
-- 1. Lock down daily_challenge_attempts INSERT to only work via the RPC function
DROP POLICY IF EXISTS "Users can insert own challenge attempts" ON public.daily_challenge_attempts;

-- No direct INSERT policy for regular users — they must use submit_daily_challenge RPC

-- 2. Create a safe view for questions (without correct_index)
CREATE VIEW public.questions_public
WITH (security_invoker = on) AS
  SELECT id, quiz_id, position, prompt, options, bible_reference, created_at
  FROM public.questions;

GRANT SELECT ON public.questions_public TO anon, authenticated;

-- 3. Restrict direct SELECT on questions base table to admins or users who already attempted the quiz
DROP POLICY IF EXISTS "View questions for published quizzes" ON public.questions;

CREATE POLICY "Questions readable after attempt or by admins"
ON public.questions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    WHERE qa.quiz_id = questions.quiz_id AND qa.user_id = auth.uid()
  )
);
