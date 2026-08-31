alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.open_conversation(p_supplier_id uuid, p_inquiry_id uuid DEFAULT NULL::uuid, p_product_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Supplier not found');
  END IF;

  -- Ignore stale/mock IDs so chat still opens (supplier is the thread key)
  IF p_product_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.products WHERE id = p_product_id
  ) THEN
    p_product_id := NULL;
  END IF;

  IF p_inquiry_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.inquiries WHERE id = p_inquiry_id
  ) THEN
    p_inquiry_id := NULL;
  END IF;

  INSERT INTO public.conversations (buyer_id, supplier_id, inquiry_id, product_id)
  VALUES (
    v_uid,
    p_supplier_id,
    p_inquiry_id,
    p_product_id
  )
  ON CONFLICT (buyer_id, supplier_id) DO UPDATE
    SET
      inquiry_id = COALESCE(EXCLUDED.inquiry_id, conversations.inquiry_id),
      product_id = COALESCE(EXCLUDED.product_id, conversations.product_id),
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'conversation_id', v_id);
END;
$function$
;


