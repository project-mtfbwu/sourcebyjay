-- Storage, full-text search, category tree seed, admin policies

-- Product images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY product_images_select ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY product_images_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY product_images_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY product_images_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Full-text search on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.specs::text, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_search_vector_trigger ON public.products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description, specs ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_search_vector_update();

UPDATE public.products SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(specs::text, '')), 'C')
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS products_search_vector_idx ON public.products USING GIN(search_vector);

-- Nested categories
UPDATE public.categories SET parent_id = NULL WHERE slug = 'apparel-accessories';
INSERT INTO public.categories (id, name, slug, parent_id) VALUES
  ('c0000001-0000-4000-8000-000000000010', 'Electronics', 'electronics', NULL),
  ('c0000001-0000-4000-8000-000000000011', 'Audio & Headphones', 'audio-headphones', 'c0000001-0000-4000-8000-000000000010'),
  ('c0000001-0000-4000-8000-000000000012', 'Solar & Energy', 'solar-energy', 'c0000001-0000-4000-8000-000000000005'),
  ('c0000001-0000-4000-8000-000000000013', 'Machinery', 'machinery', NULL),
  ('c0000001-0000-4000-8000-000000000014', 'CNC & Machine Tools', 'cnc-machine-tools', 'c0000001-0000-4000-8000-000000000013')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id;

UPDATE public.categories SET parent_id = 'c0000001-0000-4000-8000-000000000010'
WHERE slug = 'consumer-electronics';
UPDATE public.categories SET parent_id = 'c0000001-0000-4000-8000-000000000013'
WHERE slug = 'industrial-machinery';

-- Admin can verify suppliers and manage all listings
CREATE POLICY suppliers_admin_update ON public.suppliers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY products_admin_all ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Allow buyers to submit inquiries (authenticated)
CREATE POLICY inquiries_insert_buyer ON public.inquiries
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS inquiries_insert_auth ON public.inquiries;

-- Helper to promote first user to admin (run manually in dev):
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
