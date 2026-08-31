alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."products" add column "product_video_enabled" boolean not null default false;

alter table "public"."products" add column "video_url" text;

alter table "public"."supplier_gallery" add column "content_kind" text not null default 'image'::text;

alter table "public"."supplier_gallery" add column "video_url" text;

alter table "public"."supplier_gallery" add constraint "supplier_gallery_content_kind_check" CHECK ((content_kind = ANY (ARRAY['image'::text, 'video'::text]))) not valid;

alter table "public"."supplier_gallery" validate constraint "supplier_gallery_content_kind_check";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.supplier_plan_features(p_supplier_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.supplier_video_slot_count(p_supplier_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT count(*)::integer
  FROM public.supplier_gallery g
  WHERE g.supplier_id = p_supplier_id
    AND g.content_kind = 'video'
    AND g.status IN ('pending', 'approved');
$function$
;

UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
WHERE id = 'supplier-media';

UPDATE public.listing_plans SET features = features || '{"product_video":false,"video_slots":0,"video_tab":false}'::jsonb WHERE slug IN ('free', 'starter');
UPDATE public.listing_plans SET features = features || '{"product_video":true,"video_slots":0,"video_tab":false}'::jsonb WHERE slug = 'pro';
UPDATE public.listing_plans SET features = features || '{"product_video":true,"video_slots":5,"video_tab":true}'::jsonb WHERE slug = 'business';
UPDATE public.listing_plans SET features = features || '{"product_video":true,"video_slots":10,"video_tab":true}'::jsonb WHERE slug = 'export';
UPDATE public.listing_plans SET features = features || '{"product_video":true,"video_slots":null,"video_tab":true}'::jsonb WHERE slug = 'enterprise';

GRANT EXECUTE ON FUNCTION public.supplier_plan_features(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.supplier_video_slot_count(uuid) TO authenticated;

