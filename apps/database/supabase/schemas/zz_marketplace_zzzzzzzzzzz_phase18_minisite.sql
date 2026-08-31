-- Phase 18: Business+ custom factory mini-site (/factory/{slug})

UPDATE public.listing_plans
SET features = features || '{"custom_minisite": true}'::jsonb
WHERE slug IN ('business', 'export', 'enterprise');

CREATE OR REPLACE FUNCTION public.supplier_plan_features(p_supplier_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT coalesce(
    (
      SELECT lp.features || CASE
        WHEN lp.slug IN ('business', 'export', 'enterprise')
        THEN '{"custom_minisite": true}'::jsonb
        ELSE '{}'::jsonb
      END
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
