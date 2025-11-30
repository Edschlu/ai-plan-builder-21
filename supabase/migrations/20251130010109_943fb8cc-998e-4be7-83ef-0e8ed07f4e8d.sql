-- Drop old tables
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.scenarios CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  preset TEXT CHECK (preset IN ('saas', 'marketplace', 'app', 'hardware', 'services', 'ecommerce', 'subscription')),
  business_model JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_plans table
CREATE TABLE public.business_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  problem_solution JSONB,
  target_users JSONB,
  customer_segments JSONB,
  competitive_insight TEXT,
  revenue_logic JSONB,
  cost_structure JSONB,
  hiring_assumptions JSONB,
  kpis JSONB,
  risks JSONB,
  investor_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_models table
CREATE TABLE public.financial_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scenario_type TEXT DEFAULT 'base' CHECK (scenario_type IN ('base', 'optimistic', 'pessimistic')),
  months INTEGER DEFAULT 24,
  starting_cash DECIMAL(15, 2) DEFAULT 0,
  monthly_data JSONB,
  assumptions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspaces table for collaboration
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  section TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ideas
CREATE POLICY "Users can view their own ideas and workspace ideas"
ON public.ideas FOR SELECT
USING (
  auth.uid() = user_id OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own ideas"
ON public.ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas and workspace ideas"
ON public.ideas FOR UPDATE
USING (
  auth.uid() = user_id OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Users can delete their own ideas"
ON public.ideas FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for business_plans
CREATE POLICY "Users can view plans for accessible ideas"
ON public.business_plans FOR SELECT
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create plans for accessible ideas"
ON public.business_plans FOR INSERT
WITH CHECK (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id)
);

CREATE POLICY "Users can update plans for accessible ideas"
ON public.business_plans FOR UPDATE
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  ))
);

CREATE POLICY "Users can delete their own plans"
ON public.business_plans FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for financial_models
CREATE POLICY "Users can view models for accessible ideas"
ON public.financial_models FOR SELECT
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create models for accessible ideas"
ON public.financial_models FOR INSERT
WITH CHECK (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id)
);

CREATE POLICY "Users can update models for accessible ideas"
ON public.financial_models FOR UPDATE
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  ))
);

CREATE POLICY "Users can delete their own models"
ON public.financial_models FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for workspaces
CREATE POLICY "Users can view their workspaces"
ON public.workspaces FOR SELECT
USING (
  auth.uid() = owner_id OR
  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create their own workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their workspaces"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies for workspace_members
CREATE POLICY "Members can view their workspace memberships"
ON public.workspace_members FOR SELECT
USING (
  auth.uid() = user_id OR
  workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "Workspace owners and admins can add members"
ON public.workspace_members FOR INSERT
WITH CHECK (
  workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "Workspace owners and admins can update members"
ON public.workspace_members FOR UPDATE
USING (
  workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "Workspace owners and admins can remove members"
ON public.workspace_members FOR DELETE
USING (
  workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- RLS Policies for comments
CREATE POLICY "Users can view comments on accessible ideas"
ON public.comments FOR SELECT
USING (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create comments on accessible ideas"
ON public.comments FOR INSERT
WITH CHECK (
  idea_id IN (SELECT id FROM public.ideas WHERE auth.uid() = user_id OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )) AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_ideas_workspace_id ON public.ideas(workspace_id);
CREATE INDEX idx_business_plans_idea_id ON public.business_plans(idea_id);
CREATE INDEX idx_financial_models_idea_id ON public.financial_models(idea_id);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_comments_idea_id ON public.comments(idea_id);

-- Update triggers
CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON public.ideas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_plans_updated_at
BEFORE UPDATE ON public.business_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_models_updated_at
BEFORE UPDATE ON public.financial_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();