-- Enum for request status
CREATE TYPE public.admin_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Table for admin access requests
CREATE TABLE public.admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status public.admin_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- A user can create their own request
CREATE POLICY "Users can create their own admin request"
  ON public.admin_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A user can see their own request
CREATE POLICY "Users can view their own admin request"
  ON public.admin_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all requests
CREATE POLICY "Admins can view all admin requests"
  ON public.admin_requests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update admin requests"
  ON public.admin_requests
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete admin requests"
  ON public.admin_requests
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_requests_status ON public.admin_requests(status);