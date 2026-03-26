-- Fix infinite recursion in RLS policies
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Create a helper function that bypasses RLS to check membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid, uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = uid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Create a helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id uuid, uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = uid AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 3: Drop the recursive policies
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.workspace_members;

-- Step 4: Drop and recreate workspace policies that also reference workspace_members
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
CREATE POLICY "Members can view workspaces" ON public.workspaces
FOR SELECT USING (public.is_workspace_member(id, auth.uid()));

-- Step 5: Recreate workspace_members policies using helper functions
CREATE POLICY "Members can view workspace members" ON public.workspace_members
FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete members" ON public.workspace_members
FOR DELETE USING (public.is_workspace_admin(workspace_id, auth.uid()));

-- Step 6: Fix channels policies
DROP POLICY IF EXISTS "Workspace members can view channels" ON public.channels;
DROP POLICY IF EXISTS "Workspace members can create channels" ON public.channels;

CREATE POLICY "Workspace members can view channels" ON public.channels
FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create channels" ON public.channels
FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- Step 7: Fix messages policies
DROP POLICY IF EXISTS "Channel members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Channel members can send messages" ON public.messages;

CREATE POLICY "Channel members can view messages" ON public.messages
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND public.is_workspace_member(c.workspace_id, auth.uid()))
);

CREATE POLICY "Channel members can send messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND public.is_workspace_member(c.workspace_id, auth.uid()))
);

-- Step 8: Fix channel_members policies
DROP POLICY IF EXISTS "Workspace members can view channel members" ON public.channel_members;

CREATE POLICY "Workspace members can view channel members" ON public.channel_members
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND public.is_workspace_member(c.workspace_id, auth.uid()))
);

-- Step 9: Fix invites policy
DROP POLICY IF EXISTS "Admins can create invites" ON public.invites;

CREATE POLICY "Admins can create invites" ON public.invites
FOR INSERT WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));
