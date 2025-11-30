-- Create table for plan categories
CREATE TABLE IF NOT EXISTS public.plan_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'cost', 'headcount', 'investment', 'tax', 'custom')),
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for plan rows (individual line items)
CREATE TABLE IF NOT EXISTS public.plan_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.plan_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  row_type TEXT NOT NULL CHECK (row_type IN ('revenue', 'cost', 'headcount', 'investment', 'tax', 'custom')),
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  payment_delay_days INTEGER DEFAULT 0,
  monthly_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for forecast assumptions
CREATE TABLE IF NOT EXISTS public.forecast_assumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  revenue_growth_rate DECIMAL(5,2) DEFAULT 0,
  cost_inflation_rate DECIMAL(5,2) DEFAULT 0,
  starting_cash DECIMAL(15,2) DEFAULT 0,
  scenario_type TEXT DEFAULT 'base' CHECK (scenario_type IN ('base', 'optimistic', 'pessimistic')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_assumptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plan_categories
CREATE POLICY "Users can view categories for accessible ideas"
ON public.plan_categories FOR SELECT
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create categories for accessible ideas"
ON public.plan_categories FOR INSERT
WITH CHECK (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id) AND auth.uid() = user_id
);

CREATE POLICY "Users can update categories for accessible ideas"
ON public.plan_categories FOR UPDATE
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  ))
);

CREATE POLICY "Users can delete their own categories"
ON public.plan_categories FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for plan_rows
CREATE POLICY "Users can view rows for accessible ideas"
ON public.plan_rows FOR SELECT
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create rows for accessible ideas"
ON public.plan_rows FOR INSERT
WITH CHECK (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id) AND auth.uid() = user_id
);

CREATE POLICY "Users can update rows for accessible ideas"
ON public.plan_rows FOR UPDATE
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  ))
);

CREATE POLICY "Users can delete their own rows"
ON public.plan_rows FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for forecast_assumptions
CREATE POLICY "Users can view assumptions for accessible ideas"
ON public.forecast_assumptions FOR SELECT
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create assumptions for accessible ideas"
ON public.forecast_assumptions FOR INSERT
WITH CHECK (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id) AND auth.uid() = user_id
);

CREATE POLICY "Users can update assumptions for accessible ideas"
ON public.forecast_assumptions FOR UPDATE
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  ))
);

CREATE POLICY "Users can delete their own assumptions"
ON public.forecast_assumptions FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_plan_categories_idea_id ON public.plan_categories(idea_id);
CREATE INDEX idx_plan_rows_idea_id ON public.plan_rows(idea_id);
CREATE INDEX idx_plan_rows_category_id ON public.plan_rows(category_id);
CREATE INDEX idx_forecast_assumptions_idea_id ON public.forecast_assumptions(idea_id);

-- Update triggers
CREATE TRIGGER update_plan_categories_updated_at
BEFORE UPDATE ON public.plan_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_rows_updated_at
BEFORE UPDATE ON public.plan_rows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forecast_assumptions_updated_at
BEFORE UPDATE ON public.forecast_assumptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();