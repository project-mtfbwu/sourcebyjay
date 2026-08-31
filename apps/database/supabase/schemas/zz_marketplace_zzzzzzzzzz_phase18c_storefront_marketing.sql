-- Phase 18C: Storefront marketing fields (logo + featured product order)

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS logo_url text;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS storefront_featured_product_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
