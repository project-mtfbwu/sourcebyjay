-- Phase 2: restore profiles (dropped by trust_media migration drift) + buyer GSTIN/industry.
-- Also restore listing_status + product listing columns required by the web app.

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('buyer', 'seller', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'buyer',
  company_name text,
  phone text,
  country text,
  city text,
  bio text,
  gstin text,
  industry text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_select_public_sellers ON public.profiles;
CREATE POLICY profiles_select_public_sellers ON public.profiles
  FOR SELECT USING (
    role IN ('seller', 'admin')
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.owner_id = profiles.id AND s.verified = true
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON COLUMN public.profiles.gstin IS 'India GSTIN for B2B buyers';
COMMENT ON COLUMN public.profiles.industry IS 'Buyer industry / vertical';

-- Restore product listing columns removed by trust_media migration churn
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status public.listing_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'piece',
  ADD COLUMN IF NOT EXISTS max_order_qty integer,
  ADD COLUMN IF NOT EXISTS lead_time_days integer,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS shipping_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sample_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customization_available boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
