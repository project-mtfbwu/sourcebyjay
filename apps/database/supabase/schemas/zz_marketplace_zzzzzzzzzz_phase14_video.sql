-- Phase 14: factory videos + product-level video (Alibaba + IndiaMART parallels)

ALTER TABLE public.supplier_gallery
  ADD COLUMN IF NOT EXISTS content_kind text NOT NULL DEFAULT 'image'
    CHECK (content_kind IN ('image', 'video'));

ALTER TABLE public.supplier_gallery
  ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_video_enabled boolean NOT NULL DEFAULT false;

UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
WHERE id = 'supplier-media';

CREATE OR REPLACE FUNCTION public.supplier_plan_features(p_supplier_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT coalesce(
    (
      SELECT lp.features
      FROM public.vendor_subscriptions vs
      JOIN public.listing_plans lp ON lp.id = vs.plan_id
      WHERE vs.supplier_id = p_supplier_id
        AND vs.status IN ('active', 'comped')
      ORDER BY vs.updated_at DESC
      LIMIT 1
    ),
    (
      SELECT features FROM public.listing_plans WHERE slug = 'free' LIMIT 1
    ),
    '{}'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.supplier_plan_features(uuid) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.supplier_video_slot_count(p_supplier_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT count(*)::integer
  FROM public.supplier_gallery g
  WHERE g.supplier_id = p_supplier_id
    AND g.content_kind = 'video'
    AND g.status IN ('pending', 'approved');
$$;

GRANT EXECUTE ON FUNCTION public.supplier_video_slot_count(uuid) TO authenticated;
