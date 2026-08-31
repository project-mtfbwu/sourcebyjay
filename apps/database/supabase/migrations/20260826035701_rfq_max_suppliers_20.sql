alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.broadcast_rfq(p_targets jsonb, p_message text, p_quantity integer, p_contact_email text, p_title text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_inquiry_id uuid;
  v_target jsonb;
  v_supplier_id uuid;
  v_product_id uuid;
  v_plan public.listing_plans%ROWTYPE;
  v_used integer;
  v_delivered integer := 0;
  v_skipped integer := 0;
  v_skipped_ids uuid[] := ARRAY[]::uuid[];
  v_count integer;
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  IF p_message IS NULL OR length(trim(p_message)) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Message must be at least 10 characters');
  END IF;

  v_email := nullif(trim(coalesce(p_contact_email, '')), '');
  IF v_email IS NULL OR position('@' in v_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Valid contact email required');
  END IF;

  IF p_targets IS NULL OR jsonb_typeof(p_targets) <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Select at least 2 suppliers');
  END IF;

  v_count := jsonb_array_length(p_targets);
  IF v_count < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Select at least 2 suppliers');
  END IF;
  IF v_count > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Maximum 20 suppliers per RFQ');
  END IF;

  INSERT INTO public.inquiries (
    product_id, supplier_id, user_id, message, quantity, contact_email,
    is_broadcast, title
  ) VALUES (
    NULL, NULL, v_uid, trim(p_message), p_quantity, v_email,
    true, nullif(trim(coalesce(p_title, '')), '')
  )
  RETURNING id INTO v_inquiry_id;

  FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets)
  LOOP
    BEGIN
      v_supplier_id := (v_target ->> 'supplier_id')::uuid;
    EXCEPTION WHEN others THEN
      CONTINUE;
    END;

    IF v_supplier_id IS NULL THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = v_supplier_id) THEN
      CONTINUE;
    END IF;

    BEGIN
      v_product_id := nullif(v_target ->> 'product_id', '')::uuid;
    EXCEPTION WHEN others THEN
      v_product_id := NULL;
    END;

    IF v_product_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.products
      WHERE id = v_product_id AND supplier_id = v_supplier_id
    ) THEN
      v_product_id := NULL;
    END IF;

    SELECT * INTO v_plan FROM public.supplier_active_plan(v_supplier_id);
    v_used := public.supplier_rfq_leads_this_week(v_supplier_id);

    IF v_plan.rfq_leads_per_week IS NULL OR v_plan.rfq_leads_per_week <= 0 OR v_used >= v_plan.rfq_leads_per_week THEN
      INSERT INTO public.inquiry_suppliers (inquiry_id, supplier_id, product_id, status)
      VALUES (v_inquiry_id, v_supplier_id, v_product_id, 'skipped_quota')
      ON CONFLICT DO NOTHING;
      v_skipped := v_skipped + 1;
      v_skipped_ids := array_append(v_skipped_ids, v_supplier_id);
    ELSE
      INSERT INTO public.inquiry_suppliers (inquiry_id, supplier_id, product_id, status)
      VALUES (v_inquiry_id, v_supplier_id, v_product_id, 'pending')
      ON CONFLICT DO NOTHING;
      v_delivered := v_delivered + 1;
    END IF;
  END LOOP;

  IF v_delivered = 0 THEN
    DELETE FROM public.inquiries WHERE id = v_inquiry_id;
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'None of the selected suppliers can receive RFQ leads this week (plan quota). Try other sellers or wait.'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'inquiry_id', v_inquiry_id,
    'delivered', v_delivered,
    'skipped_quota', v_skipped,
    'skipped_supplier_ids', to_jsonb(v_skipped_ids)
  );
END;
$function$
;


