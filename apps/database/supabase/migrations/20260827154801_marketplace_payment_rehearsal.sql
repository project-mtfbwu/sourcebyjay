create table "public"."buyer_fake_credits" (
    "id" uuid not null default gen_random_uuid(),
    "buyer_id" uuid not null,
    "order_id" uuid not null,
    "amount" numeric(14,2) not null,
    "currency" text not null default 'INR'::text,
    "reason" text not null default 'refund'::text,
    "note" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."buyer_fake_credits" enable row level security;


  create table "public"."escrow_ledger_entries" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "entry_type" text not null,
    "amount" numeric(14,2) not null,
    "currency" text not null default 'INR'::text,
    "actor_user_id" uuid,
    "note" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."escrow_ledger_entries" enable row level security;


  create table "public"."order_invoices" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "invoice_number" text not null,
    "buyer_id" uuid not null,
    "supplier_id" uuid not null,
    "currency" text not null default 'INR'::text,
    "subtotal" numeric(14,2) not null,
    "total" numeric(14,2) not null,
    "line_summary" text,
    "issued_at" timestamp with time zone not null default now(),
    "status" text not null default 'issued'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."order_invoices" enable row level security;

CREATE INDEX buyer_fake_credits_buyer_idx ON public.buyer_fake_credits USING btree (buyer_id, created_at DESC);

CREATE UNIQUE INDEX buyer_fake_credits_pkey ON public.buyer_fake_credits USING btree (id);

CREATE UNIQUE INDEX escrow_ledger_entries_pkey ON public.escrow_ledger_entries USING btree (id);

CREATE INDEX escrow_ledger_order_idx ON public.escrow_ledger_entries USING btree (order_id, created_at);

CREATE INDEX order_invoices_buyer_idx ON public.order_invoices USING btree (buyer_id);

CREATE UNIQUE INDEX order_invoices_invoice_number_key ON public.order_invoices USING btree (invoice_number);

CREATE UNIQUE INDEX order_invoices_order_id_key ON public.order_invoices USING btree (order_id);

CREATE UNIQUE INDEX order_invoices_pkey ON public.order_invoices USING btree (id);

CREATE INDEX order_invoices_supplier_idx ON public.order_invoices USING btree (supplier_id);

alter table "public"."buyer_fake_credits" add constraint "buyer_fake_credits_pkey" PRIMARY KEY using index "buyer_fake_credits_pkey";

alter table "public"."escrow_ledger_entries" add constraint "escrow_ledger_entries_pkey" PRIMARY KEY using index "escrow_ledger_entries_pkey";

alter table "public"."order_invoices" add constraint "order_invoices_pkey" PRIMARY KEY using index "order_invoices_pkey";

alter table "public"."buyer_fake_credits" add constraint "buyer_fake_credits_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) not valid;

alter table "public"."buyer_fake_credits" validate constraint "buyer_fake_credits_buyer_id_fkey";

alter table "public"."buyer_fake_credits" add constraint "buyer_fake_credits_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."buyer_fake_credits" validate constraint "buyer_fake_credits_order_id_fkey";

alter table "public"."buyer_fake_credits" add constraint "buyer_fake_credits_reason_check" CHECK ((reason = ANY (ARRAY['refund'::text, 'cancel_paid'::text, 'dispute_refund'::text]))) not valid;

alter table "public"."buyer_fake_credits" validate constraint "buyer_fake_credits_reason_check";

alter table "public"."escrow_ledger_entries" add constraint "escrow_ledger_entries_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."escrow_ledger_entries" validate constraint "escrow_ledger_entries_actor_user_id_fkey";

alter table "public"."escrow_ledger_entries" add constraint "escrow_ledger_entries_entry_type_check" CHECK ((entry_type = ANY (ARRAY['hold'::text, 'release_to_seller'::text, 'return_to_buyer'::text, 'dispute_hold'::text]))) not valid;

alter table "public"."escrow_ledger_entries" validate constraint "escrow_ledger_entries_entry_type_check";

alter table "public"."escrow_ledger_entries" add constraint "escrow_ledger_entries_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."escrow_ledger_entries" validate constraint "escrow_ledger_entries_order_id_fkey";

alter table "public"."order_invoices" add constraint "order_invoices_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) not valid;

alter table "public"."order_invoices" validate constraint "order_invoices_buyer_id_fkey";

alter table "public"."order_invoices" add constraint "order_invoices_invoice_number_key" UNIQUE using index "order_invoices_invoice_number_key";

alter table "public"."order_invoices" add constraint "order_invoices_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_invoices" validate constraint "order_invoices_order_id_fkey";

alter table "public"."order_invoices" add constraint "order_invoices_order_id_key" UNIQUE using index "order_invoices_order_id_key";

alter table "public"."order_invoices" add constraint "order_invoices_status_check" CHECK ((status = ANY (ARRAY['issued'::text, 'voided'::text]))) not valid;

alter table "public"."order_invoices" validate constraint "order_invoices_status_check";

alter table "public"."order_invoices" add constraint "order_invoices_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) not valid;

alter table "public"."order_invoices" validate constraint "order_invoices_supplier_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cancel_unpaid_order(p_order_id uuid, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF v_order.buyer_id <> v_uid AND NOT public.is_active_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only buyer or ops can cancel unpaid');
  END IF;

  IF v_order.status NOT IN ('awaiting_payment', 'pending_confirmation', 'confirmed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only unpaid orders can use cancel-unpaid');
  END IF;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments
  SET status = 'failed',
      notes = coalesce(notes, '') || ' · cancelled unpaid',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_order.status,
    'cancelled',
    coalesce(nullif(trim(p_note), ''), 'Buyer cancelled unpaid order'),
    v_uid
  );

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_day text := to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  v_seq int;
BEGIN
  SELECT count(*)::int + 1 INTO v_seq
  FROM public.order_invoices
  WHERE invoice_number LIKE 'SBJ-INV-' || v_day || '-%';
  RETURN 'SBJ-INV-' || v_day || '-' || lpad(v_seq::text, 4, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.release_escrow_to_seller(p_order_id uuid, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF NOT public.is_active_staff()
     AND NOT (v_order.buyer_id = v_uid AND v_order.status IN ('delivered', 'completed')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ops or buyer (after delivered) only');
  END IF;

  IF v_order.escrow_status <> 'held' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escrow is not held');
  END IF;

  UPDATE public.orders
  SET escrow_status = 'released',
      status = CASE WHEN status = 'delivered' THEN 'completed' ELSE status END,
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
  VALUES (
    p_order_id,
    'release_to_seller',
    v_order.total_amount,
    v_order.currency,
    v_uid,
    coalesce(nullif(trim(p_note), ''), 'TEST MODE — fake escrow released to seller')
  );

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_order.status,
    CASE WHEN v_order.status = 'delivered' THEN 'completed' ELSE v_order.status END,
    'Escrow released to seller (fake)',
    v_uid
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'payment.fake_escrow_released',
    'order',
    p_order_id::text,
    jsonb_build_object('amount', v_order.total_amount, 'mode', 'fake')
  );

  RETURN jsonb_build_object('ok', true, 'escrow_status', 'released');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.return_escrow_to_buyer(p_order_id uuid, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_is_owner boolean := false;
  v_allowed boolean := false;
  v_reason text := 'refund';
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  v_is_owner := EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid
  );

  -- Buyer: paid / early fulfillment (Alibaba apply-for-refund path)
  IF v_order.buyer_id = v_uid
     AND v_order.escrow_status IN ('held', 'disputed')
     AND v_order.status IN ('paid', 'in_production', 'shipped', 'delivered') THEN
    v_allowed := true;
    v_reason := 'refund';
  ELSIF public.is_active_staff()
     AND v_order.escrow_status IN ('held', 'disputed')
     AND v_order.status NOT IN ('cancelled') THEN
    v_allowed := true;
    v_reason := 'refund';
  END IF;

  -- seller cannot self-refund (ops/buyer only)
  IF v_is_owner AND NOT public.is_active_staff() AND v_order.buyer_id <> v_uid THEN
    v_allowed := false;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Refund / return not allowed for this order');
  END IF;

  IF v_order.escrow_status = 'refunded' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Already returned to buyer');
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      escrow_status = 'refunded',
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments
  SET status = 'refunded',
      notes = coalesce(notes, '') || ' · fake refund returned to buyer',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'paid';

  UPDATE public.order_invoices
  SET status = 'voided'
  WHERE order_id = p_order_id AND status = 'issued';

  INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
  VALUES (
    p_order_id,
    'return_to_buyer',
    v_order.total_amount,
    v_order.currency,
    v_uid,
    coalesce(nullif(trim(p_note), ''), 'TEST MODE — fake funds returned to buyer')
  );

  INSERT INTO public.buyer_fake_credits (buyer_id, order_id, amount, currency, reason, note)
  VALUES (
    v_order.buyer_id,
    p_order_id,
    v_order.total_amount,
    v_order.currency,
    v_reason,
    coalesce(nullif(trim(p_note), ''), 'Returned to buyer (fake wallet)')
  );

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_order.status,
    'cancelled',
    'Escrow returned to buyer (fake) · ' || coalesce(nullif(trim(p_note), ''), 'refund'),
    v_uid
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'payment.fake_return_to_buyer',
    'order',
    p_order_id::text,
    jsonb_build_object('amount', v_order.total_amount, 'mode', 'fake')
  );

  RETURN jsonb_build_object(
    'ok', true,
    'escrow_status', 'refunded',
    'returned_to_buyer', true,
    'amount', v_order.total_amount
  );
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
  v_inv text;
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
      notes = coalesce(notes, '') || ' · marked paid via fake slab (escrow held)',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  -- Alibaba parallel: on-platform pay → funds held in escrow (fake)
  UPDATE public.orders
  SET status = 'paid',
      updated_at = now(),
      guarantee_protected = v_protected,
      guarantee_policy_id = CASE WHEN v_protected THEN v_policy.id ELSE NULL END,
      escrow_status = 'held'
  WHERE id = p_order_id;

  INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
  VALUES (
    p_order_id,
    'hold',
    v_order.total_amount,
    v_order.currency,
    v_uid,
    'TEST MODE — fake funds held in platform escrow'
  );

  -- Invoice (skip if already exists)
  IF NOT EXISTS (SELECT 1 FROM public.order_invoices WHERE order_id = p_order_id) THEN
    v_inv := public.next_invoice_number();
    INSERT INTO public.order_invoices (
      order_id, invoice_number, buyer_id, supplier_id,
      currency, subtotal, total, line_summary, status
    )
    VALUES (
      p_order_id,
      v_inv,
      v_order.buyer_id,
      v_order.supplier_id,
      v_order.currency,
      v_order.total_amount,
      v_order.total_amount,
      'Qty ' || v_order.quantity::text || CASE WHEN v_order.is_sample THEN ' (sample)' ELSE '' END,
      'issued'
    );
  ELSE
    SELECT invoice_number INTO v_inv FROM public.order_invoices WHERE order_id = p_order_id;
  END IF;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_from,
    'paid',
    CASE
      WHEN v_protected THEN
        'TEST MODE fake payment — escrow held · Guarantee on · invoice ' || coalesce(v_inv, '')
      ELSE
        'TEST MODE fake payment — escrow held · invoice ' || coalesce(v_inv, '')
    END,
    v_uid
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'payment.fake_escrow_held',
    'order',
    p_order_id::text,
    jsonb_build_object(
      'mode', 'fake',
      'guarantee_protected', v_protected,
      'invoice_number', v_inv
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'mode', 'fake',
    'guarantee_protected', v_protected,
    'guarantee_eligible', v_eligible,
    'escrow_status', 'held',
    'invoice_number', v_inv
  );
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
  v_prev_escrow text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  v_from := v_order.status;
  v_prev_escrow := v_order.escrow_status;
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
      OR (v_from = 'awaiting_payment' AND p_to_status = 'confirmed')
      OR (p_to_status = 'cancelled' AND v_from NOT IN ('completed', 'cancelled'))
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
        WHEN p_to_status = 'completed' AND escrow_status = 'held'
          THEN 'released'
        ELSE escrow_status
      END
  WHERE id = p_order_id;

  IF p_to_status = 'completed' AND v_prev_escrow = 'held' THEN
    INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
    VALUES (
      p_order_id,
      'release_to_seller',
      v_order.total_amount,
      v_order.currency,
      v_uid,
      'Auto-release on order completed (fake)'
    );
  END IF;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_from, p_to_status, p_note, v_uid);

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

grant delete on table "public"."buyer_fake_credits" to "anon";

grant insert on table "public"."buyer_fake_credits" to "anon";

grant references on table "public"."buyer_fake_credits" to "anon";

grant select on table "public"."buyer_fake_credits" to "anon";

grant trigger on table "public"."buyer_fake_credits" to "anon";

grant truncate on table "public"."buyer_fake_credits" to "anon";

grant update on table "public"."buyer_fake_credits" to "anon";

grant delete on table "public"."buyer_fake_credits" to "authenticated";

grant insert on table "public"."buyer_fake_credits" to "authenticated";

grant references on table "public"."buyer_fake_credits" to "authenticated";

grant select on table "public"."buyer_fake_credits" to "authenticated";

grant trigger on table "public"."buyer_fake_credits" to "authenticated";

grant truncate on table "public"."buyer_fake_credits" to "authenticated";

grant update on table "public"."buyer_fake_credits" to "authenticated";

grant delete on table "public"."buyer_fake_credits" to "service_role";

grant insert on table "public"."buyer_fake_credits" to "service_role";

grant references on table "public"."buyer_fake_credits" to "service_role";

grant select on table "public"."buyer_fake_credits" to "service_role";

grant trigger on table "public"."buyer_fake_credits" to "service_role";

grant truncate on table "public"."buyer_fake_credits" to "service_role";

grant update on table "public"."buyer_fake_credits" to "service_role";

grant delete on table "public"."escrow_ledger_entries" to "anon";

grant insert on table "public"."escrow_ledger_entries" to "anon";

grant references on table "public"."escrow_ledger_entries" to "anon";

grant select on table "public"."escrow_ledger_entries" to "anon";

grant trigger on table "public"."escrow_ledger_entries" to "anon";

grant truncate on table "public"."escrow_ledger_entries" to "anon";

grant update on table "public"."escrow_ledger_entries" to "anon";

grant delete on table "public"."escrow_ledger_entries" to "authenticated";

grant insert on table "public"."escrow_ledger_entries" to "authenticated";

grant references on table "public"."escrow_ledger_entries" to "authenticated";

grant select on table "public"."escrow_ledger_entries" to "authenticated";

grant trigger on table "public"."escrow_ledger_entries" to "authenticated";

grant truncate on table "public"."escrow_ledger_entries" to "authenticated";

grant update on table "public"."escrow_ledger_entries" to "authenticated";

grant delete on table "public"."escrow_ledger_entries" to "service_role";

grant insert on table "public"."escrow_ledger_entries" to "service_role";

grant references on table "public"."escrow_ledger_entries" to "service_role";

grant select on table "public"."escrow_ledger_entries" to "service_role";

grant trigger on table "public"."escrow_ledger_entries" to "service_role";

grant truncate on table "public"."escrow_ledger_entries" to "service_role";

grant update on table "public"."escrow_ledger_entries" to "service_role";

grant delete on table "public"."order_invoices" to "anon";

grant insert on table "public"."order_invoices" to "anon";

grant references on table "public"."order_invoices" to "anon";

grant select on table "public"."order_invoices" to "anon";

grant trigger on table "public"."order_invoices" to "anon";

grant truncate on table "public"."order_invoices" to "anon";

grant update on table "public"."order_invoices" to "anon";

grant delete on table "public"."order_invoices" to "authenticated";

grant insert on table "public"."order_invoices" to "authenticated";

grant references on table "public"."order_invoices" to "authenticated";

grant select on table "public"."order_invoices" to "authenticated";

grant trigger on table "public"."order_invoices" to "authenticated";

grant truncate on table "public"."order_invoices" to "authenticated";

grant update on table "public"."order_invoices" to "authenticated";

grant delete on table "public"."order_invoices" to "service_role";

grant insert on table "public"."order_invoices" to "service_role";

grant references on table "public"."order_invoices" to "service_role";

grant select on table "public"."order_invoices" to "service_role";

grant trigger on table "public"."order_invoices" to "service_role";

grant truncate on table "public"."order_invoices" to "service_role";

grant update on table "public"."order_invoices" to "service_role";


  create policy "buyer_fake_credits_select"
  on "public"."buyer_fake_credits"
  as permissive
  for select
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff()));



  create policy "escrow_ledger_select"
  on "public"."escrow_ledger_entries"
  as permissive
  for select
  to authenticated
using ((public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = escrow_ledger_entries.order_id) AND ((o.buyer_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.suppliers s
          WHERE ((s.id = o.supplier_id) AND (s.owner_id = auth.uid()))))))))));



  create policy "order_invoices_select"
  on "public"."order_invoices"
  as permissive
  for select
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = order_invoices.supplier_id) AND (s.owner_id = auth.uid()))))));



