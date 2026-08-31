-- Phase 12-compliance: India B2B fields (Alibaba trust + IndiaMART statutory) — English UI only

DO $$ BEGIN
  CREATE TYPE public.supplier_business_type AS ENUM ('manufacturer', 'trader', 'both');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS pan text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS business_type public.supplier_business_type,
  ADD COLUMN IF NOT EXISTS employee_count_band text,
  ADD COLUMN IF NOT EXISTS msme_udhyam text,
  ADD COLUMN IF NOT EXISTS export_markets jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS hsn_code text,
  ADD COLUMN IF NOT EXISTS gst_rate_bps integer;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_gst_rate_bps_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_gst_rate_bps_check
  CHECK (gst_rate_bps IS NULL OR gst_rate_bps IN (0, 500, 1200, 1800, 2800));

ALTER TABLE public.supplier_certificates
  ADD COLUMN IF NOT EXISTS cert_type text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS cert_number text,
  ADD COLUMN IF NOT EXISTS issuing_authority text;

CREATE TABLE IF NOT EXISTS public.buyer_business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Default',
  company_name text,
  gstin text,
  pan text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  country text NOT NULL DEFAULT 'India',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS buyer_business_profiles_buyer_idx
  ON public.buyer_business_profiles (buyer_id, is_default DESC, created_at DESC);

ALTER TABLE public.buyer_business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS buyer_business_profiles_select_own ON public.buyer_business_profiles;
CREATE POLICY buyer_business_profiles_select_own ON public.buyer_business_profiles
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR public.is_active_staff());

DROP POLICY IF EXISTS buyer_business_profiles_insert_own ON public.buyer_business_profiles;
CREATE POLICY buyer_business_profiles_insert_own ON public.buyer_business_profiles
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS buyer_business_profiles_update_own ON public.buyer_business_profiles;
CREATE POLICY buyer_business_profiles_update_own ON public.buyer_business_profiles
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS buyer_business_profiles_delete_own ON public.buyer_business_profiles;
CREATE POLICY buyer_business_profiles_delete_own ON public.buyer_business_profiles
  FOR DELETE TO authenticated
  USING (buyer_id = auth.uid());

DROP TRIGGER IF EXISTS set_buyer_business_profiles_updated_at ON public.buyer_business_profiles;
CREATE TRIGGER set_buyer_business_profiles_updated_at
  BEFORE UPDATE ON public.buyer_business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON TABLE public.buyer_business_profiles TO authenticated, service_role;

-- Light format checks (IndiaMART / GST portal patterns)
CREATE OR REPLACE FUNCTION public.is_valid_gstin(p_gstin text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(
    p_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_valid_pan(p_pan text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(p_pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$', false);
$$;

CREATE OR REPLACE FUNCTION public.is_valid_hsn(p_hsn text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(p_hsn ~ '^[0-9]{4,8}$', false);
$$;

GRANT EXECUTE ON FUNCTION public.is_valid_gstin(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_pan(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_hsn(text) TO anon, authenticated;

-- Ops-toggleable seller fields (India compliance)
INSERT INTO public.form_field_configs (persona, field_key, label, mode, sort_order)
VALUES
  ('seller', 'pan', 'PAN', 'required', 55),
  ('seller', 'pincode', 'PIN code', 'required', 75),
  ('seller', 'state', 'State', 'required', 76),
  ('seller', 'business_type', 'Business type', 'required', 77),
  ('seller', 'msme_udhyam', 'MSME / Udyam', 'optional', 78),
  ('buyer', 'business_profiles', 'Saved business details', 'optional', 95)
ON CONFLICT (persona, field_key) DO NOTHING;
