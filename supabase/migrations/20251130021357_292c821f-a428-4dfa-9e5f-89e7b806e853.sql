-- Create cashflow projects table
CREATE TABLE public.cashflow_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashflow_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own cashflow projects"
  ON public.cashflow_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cashflow projects"
  ON public.cashflow_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cashflow projects"
  ON public.cashflow_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cashflow projects"
  ON public.cashflow_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create cashflow categories table
CREATE TABLE public.cashflow_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.cashflow_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashflow_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view categories for their projects"
  ON public.cashflow_categories FOR SELECT
  USING (project_id IN (
    SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create categories for their projects"
  ON public.cashflow_categories FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid())
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update categories for their projects"
  ON public.cashflow_categories FOR UPDATE
  USING (project_id IN (
    SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete categories for their projects"
  ON public.cashflow_categories FOR DELETE
  USING (project_id IN (
    SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid()
  ));

-- Create cashflow rows table
CREATE TABLE public.cashflow_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.cashflow_categories(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.cashflow_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashflow_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rows
CREATE POLICY "Users can view rows for their projects"
  ON public.cashflow_rows FOR SELECT
  USING (project_id IN (
    SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create rows for their projects"
  ON public.cashflow_rows FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid())
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update rows for their projects"
  ON public.cashflow_rows FOR UPDATE
  USING (project_id IN (
    SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete rows for their projects"
  ON public.cashflow_rows FOR DELETE
  USING (project_id IN (
    SELECT id FROM public.cashflow_projects WHERE user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_cashflow_categories_project_id ON public.cashflow_categories(project_id);
CREATE INDEX idx_cashflow_rows_category_id ON public.cashflow_rows(category_id);
CREATE INDEX idx_cashflow_rows_project_id ON public.cashflow_rows(project_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_cashflow_projects_updated_at
  BEFORE UPDATE ON public.cashflow_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cashflow_rows_updated_at
  BEFORE UPDATE ON public.cashflow_rows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();