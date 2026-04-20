CREATE TABLE public.daily_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  reference TEXT NOT NULL,
  commentary TEXT,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily quotes are public"
ON public.daily_quotes
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage daily quotes"
ON public.daily_quotes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));