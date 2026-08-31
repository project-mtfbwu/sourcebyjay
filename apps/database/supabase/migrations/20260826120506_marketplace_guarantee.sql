alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

drop function if exists "public"."fake_mark_order_paid"(p_order_id uuid);


  create table "public"."dispute_messages" (
    "id" uuid not null default gen_random_uuid(),
    "dispute_id" uuid not null,
    "sender_id" uuid,
    "sender_type" text not null,
    "body" text not null,
    "attachments" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."dispute_messages" enable row level security;


  create table "public"."disputes" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "opened_by" uuid not null,
    "reason" text not null,
    "status" text not null default 'open'::text,
    "resolution" text,
    "refund_amount_cents" bigint,
    "buyer_note" text,
    "assigned_staff_id" uuid,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."disputes" enable row level security;


  create table "public"."guarantee_policies" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "coverage_quality" boolean not null default true,
    "coverage_shipping" boolean not null default true,
    "dispute_days" integer not null default 30,
    "max_order_inr_cents" bigint,
    "max_order_usd_cents" bigint,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."guarantee_policies" enable row level security;

alter table "public"."orders" add column "delivered_at" timestamp with time zone;

alter table "public"."orders" add column "escrow_status" text not null default 'none'::text;

alter table "public"."orders" add column "guarantee_policy_id" uuid;

alter table "public"."orders" add column "guarantee_protected" boolean not null default false;

alter table "public"."suppliers" add column "guarantee_ops_override" boolean;

alter table "public"."suppliers" add column "guarantee_policy_id" uuid;

CREATE INDEX dispute_messages_dispute_idx ON public.dispute_messages USING btree (dispute_id, created_at);

CREATE UNIQUE INDEX dispute_messages_pkey ON public.dispute_messages USING btree (id);

CREATE UNIQUE INDEX disputes_one_open_per_order_idx ON public.disputes USING btree (order_id) WHERE (status = ANY (ARRAY['open'::text, 'under_review'::text]));

CREATE INDEX disputes_order_idx ON public.disputes USING btree (order_id);

CREATE UNIQUE INDEX disputes_pkey ON public.disputes USING btree (id);

CREATE INDEX disputes_status_idx ON public.disputes USING btree (status, created_at DESC);

CREATE UNIQUE INDEX guarantee_policies_pkey ON public.guarantee_policies USING btree (id);

CREATE INDEX orders_guarantee_idx ON public.orders USING btree (guarantee_protected) WHERE (guarantee_protected = true);

alter table "public"."dispute_messages" add constraint "dispute_messages_pkey" PRIMARY KEY using index "dispute_messages_pkey";

alter table "public"."disputes" add constraint "disputes_pkey" PRIMARY KEY using index "disputes_pkey";

alter table "public"."guarantee_policies" add constraint "guarantee_policies_pkey" PRIMARY KEY using index "guarantee_policies_pkey";

alter table "public"."dispute_messages" add constraint "dispute_messages_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE not valid;

alter table "public"."dispute_messages" validate constraint "dispute_messages_dispute_id_fkey";

alter table "public"."dispute_messages" add constraint "dispute_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."dispute_messages" validate constraint "dispute_messages_sender_id_fkey";

alter table "public"."dispute_messages" add constraint "dispute_messages_sender_type_check" CHECK ((sender_type = ANY (ARRAY['buyer'::text, 'vendor'::text, 'ops'::text, 'system'::text]))) not valid;

alter table "public"."dispute_messages" validate constraint "dispute_messages_sender_type_check";

alter table "public"."disputes" add constraint "disputes_assigned_staff_id_fkey" FOREIGN KEY (assigned_staff_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."disputes" validate constraint "disputes_assigned_staff_id_fkey";

alter table "public"."disputes" add constraint "disputes_opened_by_fkey" FOREIGN KEY (opened_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."disputes" validate constraint "disputes_opened_by_fkey";

alter table "public"."disputes" add constraint "disputes_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."disputes" validate constraint "disputes_order_id_fkey";

alter table "public"."disputes" add constraint "disputes_reason_check" CHECK ((reason = ANY (ARRAY['quality_mismatch'::text, 'not_shipped'::text, 'wrong_quantity'::text, 'damaged'::text, 'non_delivery'::text, 'gst_invoice'::text, 'other'::text]))) not valid;

alter table "public"."disputes" validate constraint "disputes_reason_check";

alter table "public"."disputes" add constraint "disputes_resolution_check" CHECK (((resolution IS NULL) OR (resolution = ANY (ARRAY['full_refund'::text, 'partial_refund'::text, 'reject'::text, 'withdrawn'::text])))) not valid;

alter table "public"."disputes" validate constraint "disputes_resolution_check";

alter table "public"."disputes" add constraint "disputes_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'under_review'::text, 'resolved'::text, 'rejected'::text, 'cancelled'::text]))) not valid;

alter table "public"."disputes" validate constraint "disputes_status_check";

alter table "public"."guarantee_policies" add constraint "guarantee_policies_dispute_days_check" CHECK (((dispute_days > 0) AND (dispute_days <= 365))) not valid;

alter table "public"."guarantee_policies" validate constraint "guarantee_policies_dispute_days_check";

alter table "public"."orders" add constraint "orders_escrow_status_check" CHECK ((escrow_status = ANY (ARRAY['none'::text, 'held'::text, 'released'::text, 'refunded'::text, 'disputed'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_escrow_status_check";

alter table "public"."orders" add constraint "orders_guarantee_policy_id_fkey" FOREIGN KEY (guarantee_policy_id) REFERENCES public.guarantee_policies(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_guarantee_policy_id_fkey";

alter table "public"."suppliers" add constraint "suppliers_guarantee_policy_id_fkey" FOREIGN KEY (guarantee_policy_id) REFERENCES public.guarantee_policies(id) ON DELETE SET NULL not valid;

alter table "public"."suppliers" validate constraint "suppliers_guarantee_policy_id_fkey";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.active_guarantee_policy()
 RETURNS public.guarantee_policies
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT *
  FROM public.guarantee_policies
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.add_dispute_message(p_dispute_id uuid, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_dispute public.disputes%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_sender_type text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  IF length(trim(coalesce(p_body, ''))) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Message required');
  END IF;

  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute not found');
  END IF;

  IF v_dispute.status NOT IN ('open', 'under_review') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute is closed');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_dispute.order_id;

  IF public.is_active_staff() THEN
    v_sender_type := 'ops';
  ELSIF v_order.buyer_id = v_uid THEN
    v_sender_type := 'buyer';
  ELSIF EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid
  ) THEN
    v_sender_type := 'vendor';
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed');
  END IF;

  INSERT INTO public.dispute_messages (dispute_id, sender_id, sender_type, body)
  VALUES (p_dispute_id, v_uid, v_sender_type, trim(p_body));

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fake_mark_order_paid(p_order_id uuid, p_accept_guarantee_terms boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_from text;
  v_eligible boolean;
  v_policy public.guarantee_policies;
  v_protected boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF v_order.buyer_id <> v_uid AND NOT public.is_active_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only buyer or ops can mark paid (test)');
  END IF;

  IF v_order.status NOT IN ('awaiting_payment', 'pending_confirmation', 'confirmed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order is not awaiting payment');
  END IF;

  v_from := v_order.status;
  v_eligible := public.supplier_is_guarantee_eligible(v_order.supplier_id);
  SELECT * INTO v_policy FROM public.active_guarantee_policy();

  IF v_eligible AND p_accept_guarantee_terms AND FOUND THEN
    v_protected := true;
  END IF;

  UPDATE public.payments
  SET status = 'paid',
      marked_paid_by = v_uid,
      marked_paid_at = now(),
      notes = coalesce(notes, '') || ' · marked paid via fake slab',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  UPDATE public.orders
  SET status = 'paid',
      updated_at = now(),
      guarantee_protected = v_protected,
      guarantee_policy_id = CASE WHEN v_protected THEN v_policy.id ELSE NULL END,
      escrow_status = CASE WHEN v_protected THEN 'held' ELSE 'none' END
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_from,
    'paid',
    CASE
      WHEN v_protected THEN 'TEST MODE fake payment — SourceByJay Guarantee escrow held (fake)'
      WHEN v_eligible AND NOT p_accept_guarantee_terms THEN
        'TEST MODE fake payment — Guarantee available but terms not accepted (not protected)'
      ELSE 'TEST MODE fake payment — not real money · not Guarantee-eligible'
    END,
    v_uid
  );

  IF v_protected THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      v_uid,
      'guarantee.escrow_held_fake',
      'order',
      p_order_id::text,
      jsonb_build_object('policy_id', v_policy.id, 'mode', 'fake')
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'mode', 'fake',
    'guarantee_protected', v_protected,
    'guarantee_eligible', v_eligible
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.open_order_dispute(p_order_id uuid, p_reason text, p_buyer_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_policy public.guarantee_policies;
  v_days integer := 30;
  v_dispute_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF NOT v_order.guarantee_protected THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order is not covered by SourceByJay Guarantee');
  END IF;

  IF v_order.status NOT IN ('shipped', 'delivered', 'completed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute opens after shipment or delivery');
  END IF;

  IF v_order.guarantee_policy_id IS NOT NULL THEN
    SELECT * INTO v_policy FROM public.guarantee_policies WHERE id = v_order.guarantee_policy_id;
    IF FOUND THEN
      v_days := v_policy.dispute_days;
    END IF;
  END IF;

  IF v_order.delivered_at IS NOT NULL
     AND v_order.delivered_at < (now() - make_interval(days => v_days)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute window has closed');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.order_id = p_order_id AND d.status IN ('open', 'under_review')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'A dispute is already open for this order');
  END IF;

  IF p_reason NOT IN (
    'quality_mismatch', 'not_shipped', 'wrong_quantity', 'damaged',
    'non_delivery', 'gst_invoice', 'other'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid reason');
  END IF;

  INSERT INTO public.disputes (order_id, opened_by, reason, buyer_note, status)
  VALUES (p_order_id, v_uid, p_reason, nullif(trim(coalesce(p_buyer_note, '')), ''), 'open')
  RETURNING id INTO v_dispute_id;

  UPDATE public.orders
  SET escrow_status = 'disputed', updated_at = now()
  WHERE id = p_order_id AND escrow_status IN ('held', 'none');

  INSERT INTO public.dispute_messages (dispute_id, sender_id, sender_type, body)
  VALUES (
    v_dispute_id,
    v_uid,
    'buyer',
    coalesce(nullif(trim(coalesce(p_buyer_note, '')), ''), 'Dispute opened: ' || p_reason)
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'guarantee.dispute_opened',
    'dispute',
    v_dispute_id::text,
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('ok', true, 'dispute_id', v_dispute_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_dispute(p_dispute_id uuid, p_resolution text, p_refund_amount_cents bigint DEFAULT NULL::bigint, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_dispute public.disputes%ROWTYPE;
  v_new_status text;
  v_escrow text;
BEGIN
  IF v_uid IS NULL OR NOT public.staff_has_min_role('manager') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Manager+ staff only');
  END IF;

  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute not found');
  END IF;

  IF v_dispute.status NOT IN ('open', 'under_review') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute already closed');
  END IF;

  IF p_resolution NOT IN ('full_refund', 'partial_refund', 'reject', 'withdrawn') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid resolution');
  END IF;

  v_new_status := CASE WHEN p_resolution = 'reject' THEN 'rejected' ELSE 'resolved' END;
  v_escrow := CASE
    WHEN p_resolution IN ('full_refund', 'partial_refund') THEN 'refunded'
    ELSE 'released'
  END;

  UPDATE public.disputes
  SET status = v_new_status,
      resolution = p_resolution,
      refund_amount_cents = p_refund_amount_cents,
      assigned_staff_id = coalesce(assigned_staff_id, v_uid),
      resolved_at = now(),
      updated_at = now()
  WHERE id = p_dispute_id;

  UPDATE public.orders
  SET escrow_status = v_escrow, updated_at = now()
  WHERE id = v_dispute.order_id;

  INSERT INTO public.dispute_messages (dispute_id, sender_id, sender_type, body)
  VALUES (
    p_dispute_id,
    v_uid,
    'ops',
    coalesce(nullif(trim(coalesce(p_note, '')), ''), 'Resolved: ' || p_resolution)
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'guarantee.dispute_resolved',
    'dispute',
    p_dispute_id::text,
    jsonb_build_object(
      'resolution', p_resolution,
      'refund_amount_cents', p_refund_amount_cents,
      'order_id', v_dispute.order_id
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_supplier_guarantee_override(p_supplier_id uuid, p_override boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.staff_has_min_role('manager') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Manager+ staff only');
  END IF;

  UPDATE public.suppliers
  SET guarantee_ops_override = p_override,
      updated_at = now()
  WHERE id = p_supplier_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Supplier not found');
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'guarantee.ops_override',
    'supplier',
    p_supplier_id::text,
    jsonb_build_object('override', p_override)
  );

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.supplier_is_guarantee_eligible(p_supplier_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_override boolean;
  v_plan public.listing_plans;
BEGIN
  SELECT guarantee_ops_override INTO v_override
  FROM public.suppliers
  WHERE id = p_supplier_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  SELECT * INTO v_plan FROM public.supplier_active_plan(p_supplier_id);
  IF FOUND THEN
    RETURN coalesce(v_plan.guarantee_eligible, false);
  END IF;

  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_to_status text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_allowed boolean := false;
  v_from text;
  v_is_owner boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  v_from := v_order.status;
  v_is_owner := EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid
  );

  IF public.is_active_staff() THEN
    v_allowed := true;
  ELSIF v_is_owner THEN
    v_allowed := (
      (v_from = 'paid' AND p_to_status = 'in_production')
      OR (v_from = 'in_production' AND p_to_status = 'shipped')
      OR (v_from = 'shipped' AND p_to_status = 'delivered')
      OR (v_from = 'delivered' AND p_to_status = 'completed')
    );
  ELSIF v_order.buyer_id = v_uid AND v_from = 'delivered' AND p_to_status = 'completed' THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Status change not allowed');
  END IF;

  IF p_to_status NOT IN (
    'pending_confirmation', 'confirmed', 'awaiting_payment', 'paid',
    'in_production', 'shipped', 'delivered', 'completed', 'cancelled'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid status');
  END IF;

  UPDATE public.orders
  SET status = p_to_status,
      updated_at = now(),
      delivered_at = CASE
        WHEN p_to_status = 'delivered' AND delivered_at IS NULL THEN now()
        ELSE delivered_at
      END,
      escrow_status = CASE
        WHEN guarantee_protected AND p_to_status = 'completed' AND escrow_status = 'held'
          THEN 'released'
        ELSE escrow_status
      END
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_from, p_to_status, p_note, v_uid);

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

grant delete on table "public"."dispute_messages" to "anon";

grant insert on table "public"."dispute_messages" to "anon";

grant references on table "public"."dispute_messages" to "anon";

grant select on table "public"."dispute_messages" to "anon";

grant trigger on table "public"."dispute_messages" to "anon";

grant truncate on table "public"."dispute_messages" to "anon";

grant update on table "public"."dispute_messages" to "anon";

grant delete on table "public"."dispute_messages" to "authenticated";

grant insert on table "public"."dispute_messages" to "authenticated";

grant references on table "public"."dispute_messages" to "authenticated";

grant select on table "public"."dispute_messages" to "authenticated";

grant trigger on table "public"."dispute_messages" to "authenticated";

grant truncate on table "public"."dispute_messages" to "authenticated";

grant update on table "public"."dispute_messages" to "authenticated";

grant delete on table "public"."dispute_messages" to "service_role";

grant insert on table "public"."dispute_messages" to "service_role";

grant references on table "public"."dispute_messages" to "service_role";

grant select on table "public"."dispute_messages" to "service_role";

grant trigger on table "public"."dispute_messages" to "service_role";

grant truncate on table "public"."dispute_messages" to "service_role";

grant update on table "public"."dispute_messages" to "service_role";

grant delete on table "public"."disputes" to "anon";

grant insert on table "public"."disputes" to "anon";

grant references on table "public"."disputes" to "anon";

grant select on table "public"."disputes" to "anon";

grant trigger on table "public"."disputes" to "anon";

grant truncate on table "public"."disputes" to "anon";

grant update on table "public"."disputes" to "anon";

grant delete on table "public"."disputes" to "authenticated";

grant insert on table "public"."disputes" to "authenticated";

grant references on table "public"."disputes" to "authenticated";

grant select on table "public"."disputes" to "authenticated";

grant trigger on table "public"."disputes" to "authenticated";

grant truncate on table "public"."disputes" to "authenticated";

grant update on table "public"."disputes" to "authenticated";

grant delete on table "public"."disputes" to "service_role";

grant insert on table "public"."disputes" to "service_role";

grant references on table "public"."disputes" to "service_role";

grant select on table "public"."disputes" to "service_role";

grant trigger on table "public"."disputes" to "service_role";

grant truncate on table "public"."disputes" to "service_role";

grant update on table "public"."disputes" to "service_role";

grant delete on table "public"."guarantee_policies" to "anon";

grant insert on table "public"."guarantee_policies" to "anon";

grant references on table "public"."guarantee_policies" to "anon";

grant select on table "public"."guarantee_policies" to "anon";

grant trigger on table "public"."guarantee_policies" to "anon";

grant truncate on table "public"."guarantee_policies" to "anon";

grant update on table "public"."guarantee_policies" to "anon";

grant delete on table "public"."guarantee_policies" to "authenticated";

grant insert on table "public"."guarantee_policies" to "authenticated";

grant references on table "public"."guarantee_policies" to "authenticated";

grant select on table "public"."guarantee_policies" to "authenticated";

grant trigger on table "public"."guarantee_policies" to "authenticated";

grant truncate on table "public"."guarantee_policies" to "authenticated";

grant update on table "public"."guarantee_policies" to "authenticated";

grant delete on table "public"."guarantee_policies" to "service_role";

grant insert on table "public"."guarantee_policies" to "service_role";

grant references on table "public"."guarantee_policies" to "service_role";

grant select on table "public"."guarantee_policies" to "service_role";

grant trigger on table "public"."guarantee_policies" to "service_role";

grant truncate on table "public"."guarantee_policies" to "service_role";

grant update on table "public"."guarantee_policies" to "service_role";


  create policy "dispute_messages_no_direct_insert"
  on "public"."dispute_messages"
  as permissive
  for insert
  to authenticated
with check (false);



  create policy "dispute_messages_select"
  on "public"."dispute_messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.disputes d
  WHERE ((d.id = dispute_messages.dispute_id) AND (public.is_active_staff() OR (d.opened_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM (public.orders o
             JOIN public.suppliers s ON ((s.id = o.supplier_id)))
          WHERE ((o.id = d.order_id) AND (s.owner_id = auth.uid())))))))));



  create policy "disputes_no_direct_insert"
  on "public"."disputes"
  as permissive
  for insert
  to authenticated
with check (false);



  create policy "disputes_select"
  on "public"."disputes"
  as permissive
  for select
  to authenticated
using ((public.is_active_staff() OR (opened_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.suppliers s ON ((s.id = o.supplier_id)))
  WHERE ((o.id = disputes.order_id) AND (s.owner_id = auth.uid()))))));



  create policy "guarantee_policies_select_all"
  on "public"."guarantee_policies"
  as permissive
  for select
  to anon, authenticated
using (((active = true) OR public.is_active_staff()));



  create policy "guarantee_policies_write_staff"
  on "public"."guarantee_policies"
  as permissive
  for all
  to authenticated
using (public.staff_has_min_role('manager'::public.staff_role))
with check (public.staff_has_min_role('manager'::public.staff_role));


CREATE TRIGGER set_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_guarantee_policies_updated_at BEFORE UPDATE ON public.guarantee_policies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


