-- SourceByJay platform commission (vendor onboarding + order snapshot)
-- Runs after marketplace_security.sql (lexicographic order)
-- Generate migration: cd apps/database && supabase db diff -f marketplace_vendor_commission
--
-- Rules (locked):
--   Default commission: 5% (500 bps)
--   Minimum commission: 5% unless super_admin approves lower OR delegates permission
--   manager+ sets rate during ops vendor onboarding
--   Rate snapshotted on each order at payment time (Phase 3/7)

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  default_commission_bps integer NOT NULL DEFAULT 500,
  min_commission_bps integer NOT NULL DEFAULT 500,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_settings_default_gte_min CHECK (default_commission_bps >= min_commission_bps),
  CONSTRAINT platform_settings_bps_range CHECK (
    default_commission_bps BETWEEN 0 AND 10000
    AND min_commission_bps BETWEEN 0 AND 10000
  )
);

INSERT INTO public.platform_settings (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS can_set_below_min_commission boolean NOT NULL DEFAULT false;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS commission_rate_bps integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS commission_below_min_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_set_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS commission_notes text;

ALTER TABLE public.suppliers
  DROP CONSTRAINT IF EXISTS suppliers_commission_bps_range;

ALTER TABLE public.suppliers
  ADD CONSTRAINT suppliers_commission_bps_range
  CHECK (commission_rate_bps BETWEEN 0 AND 10000);

CREATE INDEX IF NOT EXISTS suppliers_commission_rate_bps_idx
  ON public.suppliers(commission_rate_bps);

CREATE OR REPLACE FUNCTION public.validate_supplier_commission(
  p_rate_bps integer,
  p_below_min_approved boolean,
  p_actor_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  min_bps integer;
  actor_role public.staff_role;
  actor_can_below boolean;
BEGIN
  SELECT min_commission_bps INTO min_bps FROM public.platform_settings WHERE id = true;

  IF p_rate_bps < 0 OR p_rate_bps > 10000 THEN
    RAISE EXCEPTION 'commission_rate_bps must be between 0 and 10000';
  END IF;

  SELECT sm.role, sm.can_set_below_min_commission
  INTO actor_role, actor_can_below
  FROM public.staff_members sm
  WHERE sm.user_id = p_actor_id AND sm.is_active = true;

  IF actor_role IS NULL THEN
    RAISE EXCEPTION 'only active staff may set vendor commission';
  END IF;

  IF NOT public.staff_has_min_role('manager') THEN
    RAISE EXCEPTION 'manager role or higher required to set commission';
  END IF;

  IF p_rate_bps < min_bps THEN
    IF p_below_min_approved IS NOT TRUE THEN
      RAISE EXCEPTION 'commission below % bps requires below-minimum approval', min_bps;
    END IF;

    IF actor_role <> 'super_admin' AND actor_can_below IS NOT TRUE THEN
      RAISE EXCEPTION 'only super_admin or delegated staff may approve below-minimum commission';
    END IF;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_supplier_commission(integer, boolean, uuid)
  TO authenticated;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_select_staff ON public.platform_settings
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY platform_settings_update_super_admin ON public.platform_settings
  FOR UPDATE USING (public.staff_has_min_role('super_admin'))
  WITH CHECK (public.staff_has_min_role('super_admin'));

CREATE TRIGGER set_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
