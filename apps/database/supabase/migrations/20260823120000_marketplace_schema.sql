-- SourceByJay B2B Marketplace schema

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  country text NOT NULL,
  city text NOT NULL,
  years_in_business integer NOT NULL DEFAULT 0,
  response_rate text NOT NULL DEFAULT '95%',
  main_products text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  banner_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  price numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  moq integer NOT NULL DEFAULT 1,
  sold_count integer,
  is_local boolean NOT NULL DEFAULT false,
  image_url text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_tiers jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  quantity integer,
  contact_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_select_all ON public.categories FOR SELECT USING (true);
CREATE POLICY suppliers_select_all ON public.suppliers FOR SELECT USING (true);
CREATE POLICY products_select_all ON public.products FOR SELECT USING (true);

CREATE POLICY inquiries_insert_auth ON public.inquiries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY inquiries_select_own ON public.inquiries
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);
CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS suppliers_slug_idx ON public.suppliers(slug);
