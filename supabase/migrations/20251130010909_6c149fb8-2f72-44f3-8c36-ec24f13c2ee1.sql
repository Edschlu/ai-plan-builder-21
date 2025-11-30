-- Drop the problematic policies on workspace_members
DROP POLICY IF EXISTS "Members can view their workspace memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can remove members" ON public.workspace_members;

-- Create security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Create security definer function to check workspace membership (any role)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to check workspace ownership
CREATE OR REPLACE FUNCTION public.is_workspace_owner(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces
    WHERE id = _workspace_id
      AND owner_id = _user_id
  )
$$;

-- Recreate RLS Policies for workspace_members using security definer functions
CREATE POLICY "Members can view their workspace memberships"
ON public.workspace_members FOR SELECT
USING (
  auth.uid() = user_id OR
  public.is_workspace_owner(workspace_id, auth.uid()) OR
  public.is_workspace_admin(workspace_id, auth.uid())
);

CREATE POLICY "Workspace owners and admins can add members"
ON public.workspace_members FOR INSERT
WITH CHECK (
  public.is_workspace_owner(workspace_id, auth.uid()) OR
  public.is_workspace_admin(workspace_id, auth.uid())
);

CREATE POLICY "Workspace owners and admins can update members"
ON public.workspace_members FOR UPDATE
USING (
  public.is_workspace_owner(workspace_id, auth.uid()) OR
  public.is_workspace_admin(workspace_id, auth.uid())
);

CREATE POLICY "Workspace owners and admins can remove members"
ON public.workspace_members FOR DELETE
USING (
  public.is_workspace_owner(workspace_id, auth.uid()) OR
  public.is_workspace_admin(workspace_id, auth.uid())
);