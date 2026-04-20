CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  bible_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily challenges are public"
ON public.daily_challenges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage daily challenges"
ON public.daily_challenges FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.daily_challenge_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  selected_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge attempts"
ON public.daily_challenge_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all challenge attempts"
ON public.daily_challenge_attempts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own challenge attempts"
ON public.daily_challenge_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete challenge attempts"
ON public.daily_challenge_attempts FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_daily_challenge_attempts_user ON public.daily_challenge_attempts(user_id, challenge_date DESC);