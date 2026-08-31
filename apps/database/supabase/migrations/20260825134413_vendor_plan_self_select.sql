alter table "public"."vendor_subscription_events" drop constraint "vendor_subscription_events_event_type_check";

alter table "public"."vendor_subscriptions" drop constraint "vendor_subscriptions_status_check";

CREATE UNIQUE INDEX vendor_subscriptions_one_pending_idx ON public.vendor_subscriptions USING btree (supplier_id) WHERE (status = 'pending'::text);

alter table "public"."vendor_subscription_events" add constraint "vendor_subscription_events_event_type_check" CHECK ((event_type = ANY (ARRAY['signup_default'::text, 'upgrade'::text, 'downgrade'::text, 'comp_grant'::text, 'cancel'::text, 'expire'::text, 'ops_assign'::text, 'upgrade_request'::text]))) not valid;

alter table "public"."vendor_subscription_events" validate constraint "vendor_subscription_events_event_type_check";

alter table "public"."vendor_subscriptions" add constraint "vendor_subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'cancelled'::text, 'comped'::text, 'pending'::text]))) not valid;

alter table "public"."vendor_subscriptions" validate constraint "vendor_subscriptions_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.approve_vendor_plan_request(p_supplier_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_pending public.vendor_subscriptions%ROWTYPE;
  v_current public.vendor_subscriptions%ROWTYPE;
  v_has_current boolean := false;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Staff only');
  END IF;

  SELECT * INTO v_pending
  FROM public.vendor_subscriptions
  WHERE supplier_id = p_supplier_id AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No pending request');
  END IF;

  SELECT * INTO v_current
  FROM public.vendor_subscriptions
  WHERE supplier_id = p_supplier_id AND status IN ('active', 'comped')
  ORDER BY started_at DESC
  LIMIT 1;
  v_has_current := FOUND;

  IF v_has_current THEN
    UPDATE public.vendor_subscriptions
    SET status = 'cancelled', updated_at = now()
    WHERE id = v_current.id;
  END IF;

  UPDATE public.vendor_subscriptions
  SET status = 'active',
      granted_by_staff_id = v_uid,
      notes = coalesce(notes, '') || ' · approved by ops',
      updated_at = now()
  WHERE id = v_pending.id;

  INSERT INTO public.vendor_subscription_events (
    supplier_id, from_plan_id, to_plan_id, event_type, actor_user_id
  ) VALUES (
    p_supplier_id,
    CASE WHEN v_has_current THEN v_current.plan_id ELSE NULL END,
    v_pending.plan_id,
    'ops_assign',
    v_uid
  );

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_vendor_plan(p_plan_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_supplier_id uuid;
  v_plan public.listing_plans%ROWTYPE;
  v_current public.vendor_subscriptions%ROWTYPE;
  v_has_current boolean := false;
  v_event text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT id INTO v_supplier_id
  FROM public.suppliers
  WHERE owner_id = v_uid
  LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No supplier profile yet');
  END IF;

  SELECT * INTO v_plan FROM public.listing_plans WHERE id = p_plan_id AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Plan not found');
  END IF;

  SELECT * INTO v_current
  FROM public.vendor_subscriptions
  WHERE supplier_id = v_supplier_id AND status IN ('active', 'comped')
  ORDER BY started_at DESC
  LIMIT 1;
  v_has_current := FOUND;

  IF v_has_current AND v_current.plan_id = p_plan_id THEN
    RETURN jsonb_build_object('ok', true, 'mode', 'already_active', 'slug', v_plan.slug);
  END IF;

  -- Free (or ₹0 non-enterprise): apply immediately
  IF v_plan.slug = 'free' OR (v_plan.price_inr_cents_annual = 0 AND v_plan.slug <> 'enterprise') THEN
    IF v_has_current THEN
      UPDATE public.vendor_subscriptions
      SET status = 'cancelled', updated_at = now()
      WHERE id = v_current.id;
    END IF;

    UPDATE public.vendor_subscriptions
    SET status = 'cancelled', updated_at = now()
    WHERE supplier_id = v_supplier_id AND status = 'pending';

    INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status)
    VALUES (v_supplier_id, p_plan_id, 'active');

    v_event := CASE WHEN NOT v_has_current THEN 'signup_default' ELSE 'downgrade' END;
    INSERT INTO public.vendor_subscription_events (
      supplier_id, from_plan_id, to_plan_id, event_type, actor_user_id
    ) VALUES (
      v_supplier_id,
      CASE WHEN v_has_current THEN v_current.plan_id ELSE NULL END,
      p_plan_id,
      v_event,
      v_uid
    );

    RETURN jsonb_build_object('ok', true, 'mode', 'activated', 'slug', v_plan.slug);
  END IF;

  -- Paid / enterprise: replace any existing pending request
  UPDATE public.vendor_subscriptions
  SET status = 'cancelled', updated_at = now()
  WHERE supplier_id = v_supplier_id AND status = 'pending';

  INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status, notes)
  VALUES (
    v_supplier_id,
    p_plan_id,
    'pending',
    'Seller requested — confirm after payment (Stripe later)'
  );

  INSERT INTO public.vendor_subscription_events (
    supplier_id, from_plan_id, to_plan_id, event_type, actor_user_id
  ) VALUES (
    v_supplier_id,
    CASE WHEN v_has_current THEN v_current.plan_id ELSE NULL END,
    p_plan_id,
    'upgrade_request',
    v_uid
  );

  RETURN jsonb_build_object(
    'ok', true,
    'mode', 'pending',
    'slug', v_plan.slug,
    'message', 'Request sent. Keep your current plan until ops confirms payment.'
  );
END;
$function$
;

grant execute on function public.request_vendor_plan(uuid) to authenticated;
grant execute on function public.approve_vendor_plan_request(uuid) to authenticated;
