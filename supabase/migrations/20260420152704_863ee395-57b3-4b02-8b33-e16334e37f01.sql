CREATE TABLE public.admin_role_revocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  revoked_by uuid,
  revoked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_role_revocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view revocations"
  ON public.admin_role_revocations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert revocations"
  ON public.admin_role_revocations
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete revocations"
  ON public.admin_role_revocations
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_admin_role_revocations_revoked_at
  ON public.admin_role_revocations (revoked_at DESC);