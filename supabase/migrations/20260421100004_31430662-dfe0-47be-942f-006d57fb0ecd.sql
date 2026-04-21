
-- 1. Fix user_roles: make INSERT policy RESTRICTIVE
DROP POLICY IF EXISTS "Non-admins cannot insert roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix daily_challenges: remove the policy that exposes correct_index after attempt
-- Since submit_daily_challenge RPC handles everything server-side, we only need admin access
DROP POLICY IF EXISTS "Daily challenges public read without answer" ON public.daily_challenges;

CREATE POLICY "Only admins can read full daily challenges"
ON public.daily_challenges FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
