-- Nested product categories (parent groups for storefront main product lines)

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);

-- Top-level groups
INSERT INTO public.categories (id, name, slug, parent_id) VALUES
  ('c0000001-0000-4000-8000-000000000010', 'Electronics', 'electronics', NULL),
  ('c0000001-0000-4000-8000-000000000011', 'Audio & Headphones', 'audio-headphones', 'c0000001-0000-4000-8000-000000000010'),
  ('c0000001-0000-4000-8000-000000000012', 'Solar & Energy', 'solar-energy', 'c0000001-0000-4000-8000-000000000005'),
  ('c0000001-0000-4000-8000-000000000013', 'Machinery', 'machinery', NULL),
  ('c0000001-0000-4000-8000-000000000014', 'CNC & Machine Tools', 'cnc-machine-tools', 'c0000001-0000-4000-8000-000000000013')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id;

UPDATE public.categories SET parent_id = NULL WHERE slug = 'apparel-accessories';

UPDATE public.categories SET parent_id = 'c0000001-0000-4000-8000-000000000010'
WHERE slug = 'consumer-electronics';

UPDATE public.categories SET parent_id = 'c0000001-0000-4000-8000-000000000013'
WHERE slug = 'industrial-machinery';
