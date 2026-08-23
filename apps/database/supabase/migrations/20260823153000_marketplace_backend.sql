-- SourceByJay backend: profiles, seller ownership, flexible listings

CREATE TYPE public.user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE public.listing_status AS ENUM ('draft', 'published', 'archived');

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
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

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

-- Auto-create profile on signup
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

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_select_public_sellers ON public.profiles
  FOR SELECT USING (
    role IN ('seller', 'admin')
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.owner_id = profiles.id AND s.verified = true
    )
  );

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Replace open product/supplier policies with role-aware access
DROP POLICY IF EXISTS products_select_all ON public.products;
DROP POLICY IF EXISTS suppliers_select_all ON public.suppliers;

CREATE POLICY products_select_published ON public.products
  FOR SELECT USING (status = 'published');

CREATE POLICY products_select_own ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = products.supplier_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY products_insert_seller ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY products_update_own ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = products.supplier_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY products_delete_own ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = products.supplier_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY suppliers_select_public ON public.suppliers
  FOR SELECT USING (true);

CREATE POLICY suppliers_insert_own ON public.suppliers
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY suppliers_update_own ON public.suppliers
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY suppliers_delete_own ON public.suppliers
  FOR DELETE USING (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS suppliers_owner_id_idx ON public.suppliers(owner_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Helper: check if user owns supplier
CREATE OR REPLACE FUNCTION public.user_owns_supplier(supplier uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = supplier AND s.owner_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_supplier(uuid) TO authenticated;
