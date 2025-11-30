-- Add template support to forecast_assumptions
ALTER TABLE public.forecast_assumptions
ADD COLUMN IF NOT EXISTS template_type TEXT CHECK (template_type IN ('saas', 'marketplace', 'ecommerce', 'agency', 'hardware', 'ai', 'custom'));

-- Create table for plan snapshots
CREATE TABLE IF NOT EXISTS public.plan_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for snapshots
ALTER TABLE public.plan_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for snapshots
CREATE POLICY "Users can view snapshots for accessible ideas"
ON public.plan_snapshots FOR SELECT
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create snapshots for accessible ideas"
ON public.plan_snapshots FOR INSERT
WITH CHECK (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id) AND auth.uid() = user_id
);

CREATE POLICY "Users can delete their own snapshots"
ON public.plan_snapshots FOR DELETE
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_plan_snapshots_idea_id ON public.plan_snapshots(idea_id);