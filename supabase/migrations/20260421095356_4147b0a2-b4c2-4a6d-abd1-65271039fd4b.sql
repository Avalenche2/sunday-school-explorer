
-- 1. Fix profiles: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- 2. Fix daily_challenges: create a view without correct_index for public access
CREATE VIEW public.daily_challenges_public
WITH (security_invoker = on) AS
  SELECT id, challenge_date, prompt, options, bible_reference, created_at
  FROM public.daily_challenges;

-- Restrict direct SELECT on base table to authenticated users who already attempted or admins
DROP POLICY IF EXISTS "Daily challenges are public" ON public.daily_challenges;

CREATE POLICY "Daily challenges public read without answer"
ON public.daily_challenges FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.daily_challenge_attempts dca
    WHERE dca.challenge_id = daily_challenges.id AND dca.user_id = auth.uid()
  )
);

-- Allow anon/authenticated to read the safe view (no correct_index)
GRANT SELECT ON public.daily_challenges_public TO anon, authenticated;

-- 3. Fix user_roles: explicit deny INSERT for non-admins
CREATE POLICY "Non-admins cannot insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
