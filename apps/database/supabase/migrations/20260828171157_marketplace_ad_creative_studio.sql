alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."ad_creatives" add column "body_text" text;

alter table "public"."ad_creatives" add column "creative_format" text not null default 'image'::text;

alter table "public"."ad_creatives" add column "cta_label" text not null default 'Learn more'::text;

alter table "public"."ad_creatives" add column "media_url" text;

alter table "public"."ad_creatives" add constraint "ad_creatives_creative_format_check" CHECK ((creative_format = ANY (ARRAY['text'::text, 'image'::text, 'video'::text]))) not valid;

alter table "public"."ad_creatives" validate constraint "ad_creatives_creative_format_check";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_sponsored_placements(p_placement text, p_query text DEFAULT NULL::text, p_category_slug text DEFAULT NULL::text, p_limit integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rows jsonb := '[]'::jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.bid_score DESC), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT
      cr.id AS creative_id,
      cr.campaign_id,
      cr.product_id,
      cr.creative_format,
      cr.headline_override,
      cr.body_text,
      cr.media_url,
      cr.cta_label,
      c.supplier_id,
      c.billing_model,
      c.max_cpc_bid_inr_cents,
      c.cpm_rate_inr_cents,
      coalesce(c.max_cpc_bid_inr_cents, c.cpm_rate_inr_cents, c.sponsorship_daily_inr_cents, 0) AS bid_score,
      coalesce(nullif(trim(cr.headline_override), ''), p.title, nullif(trim(cr.body_text), ''), 'Sponsored listing') AS product_title,
      coalesce(p.price, 0) AS product_price,
      coalesce(p.currency, 'INR') AS product_currency,
      coalesce(nullif(trim(cr.media_url), ''), p.image_url, '') AS product_image_url,
      s.name AS supplier_name,
      s.slug AS supplier_slug,
      coalesce(p.slug, s.slug) AS product_slug
    FROM public.ad_campaigns c
    JOIN public.ad_creatives cr ON cr.campaign_id = c.id
    LEFT JOIN public.products p ON p.id = cr.product_id AND p.status = 'published'
    JOIN public.suppliers s ON s.id = c.supplier_id
    JOIN public.ad_wallets w ON w.supplier_id = c.supplier_id
    WHERE c.status = 'active'
      AND p_placement = ANY (c.placement_types)
      AND w.balance_inr_cents > 0
      AND (c.end_at IS NULL OR c.end_at > now())
      AND c.start_at <= now()
      AND (
        cr.product_id IS NOT NULL
        OR nullif(trim(coalesce(cr.headline_override, cr.body_text, '')), '') IS NOT NULL
      )
      AND (
        c.daily_budget_inr_cents = 0
        OR (
          CASE
            WHEN c.budget_day IS DISTINCT FROM (timezone('Asia/Kolkata', now()))::date THEN 0
            ELSE c.spent_today_inr_cents
          END
        ) < c.daily_budget_inr_cents
      )
      AND (c.total_budget_inr_cents IS NULL OR c.spent_inr_cents < c.total_budget_inr_cents)
      AND (
        c.billing_model <> 'cpc'
        OR NOT EXISTS (
          SELECT 1 FROM public.ad_keywords k
          WHERE k.campaign_id = c.id AND k.negative = false
        )
        OR EXISTS (
          SELECT 1 FROM public.ad_keywords k
          WHERE k.campaign_id = c.id
            AND k.negative = false
            AND public.ad_keyword_matches(k.keyword, coalesce(p_query, ''), k.match_type)
        )
      )
      AND (
        c.category_hint IS NULL
        OR p_category_slug IS NULL
        OR c.category_hint = p_category_slug
      )
    ORDER BY bid_score DESC
    LIMIT greatest(1, least(p_limit, 10))
  ) t;

  RETURN jsonb_build_object('ok', true, 'placements', v_rows);
END;
$function$
;


