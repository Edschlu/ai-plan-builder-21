-- Create business_cases_daily table
CREATE TABLE public.business_cases_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_cases_daily ENABLE ROW LEVEL SECURITY;

-- Create policies for business_cases_daily
CREATE POLICY "Users can view their own daily cases"
  ON public.business_cases_daily
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily cases"
  ON public.business_cases_daily
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily cases"
  ON public.business_cases_daily
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily cases"
  ON public.business_cases_daily
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_business_cases_daily_updated_at
  BEFORE UPDATE ON public.business_cases_daily
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();