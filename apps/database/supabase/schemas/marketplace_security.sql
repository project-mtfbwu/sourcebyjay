-- SourceByJay security: staff RBAC + audit logging
-- Generate migration: cd apps/database && supabase db diff -f marketplace_security

CREATE TYPE public.staff_role AS ENUM (
  'super_admin',
  'admin',
  'manager',
  'viewer'
);

CREATE TABLE IF NOT EXISTS public.staff_members (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL DEFAULT 'viewer',
  department text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS staff_members_role_idx ON public.staff_members(role);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff helpers (security definer)
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid() AND sm.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.staff_has_min_role(min_role public.staff_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.staff_role;
  role_rank int;
  min_rank int;
BEGIN
  SELECT role INTO user_role
  FROM public.staff_members
  WHERE user_id = auth.uid() AND is_active = true;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  role_rank := CASE user_role
    WHEN 'viewer' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
  END;

  min_rank := CASE min_role
    WHEN 'viewer' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
  END;

  RETURN role_rank >= min_rank;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_has_min_role(public.staff_role) TO authenticated;

-- Staff: view own row; admins manage team
CREATE POLICY staff_members_select_own ON public.staff_members
  FOR SELECT USING (auth.uid() = user_id OR public.staff_has_min_role('admin'));

CREATE POLICY staff_members_insert_admin ON public.staff_members
  FOR INSERT WITH CHECK (public.staff_has_min_role('admin'));

CREATE POLICY staff_members_update_admin ON public.staff_members
  FOR UPDATE USING (public.staff_has_min_role('admin'))
  WITH CHECK (public.staff_has_min_role('admin'));

-- Audit logs: staff read; managers+ write via app (insert only)
CREATE POLICY audit_logs_select_staff ON public.audit_logs
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY audit_logs_insert_staff ON public.audit_logs
  FOR INSERT WITH CHECK (public.staff_has_min_role('manager') AND actor_id = auth.uid());

CREATE TRIGGER set_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tighten products: drop legacy open select if still present (idempotent)
-- Skip if products table doesn't exist yet (declarative schemas load order)
