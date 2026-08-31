alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";


  create table "public"."order_events" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "from_status" text,
    "to_status" text not null,
    "note" text,
    "actor_user_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."order_events" enable row level security;


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "quote_id" uuid,
    "inquiry_id" uuid,
    "buyer_id" uuid not null,
    "supplier_id" uuid not null,
    "product_id" uuid,
    "total_amount" numeric(14,2) not null,
    "currency" text not null default 'INR'::text,
    "quantity" integer not null,
    "is_sample" boolean not null default false,
    "status" text not null default 'pending_confirmation'::text,
    "commission_rate_bps" integer not null default 500,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "provider" text not null default 'fake'::text,
    "amount" numeric(14,2) not null,
    "currency" text not null default 'INR'::text,
    "status" text not null default 'pending'::text,
    "stripe_payment_intent_id" text,
    "marked_paid_by" uuid,
    "marked_paid_at" timestamp with time zone,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."payments" enable row level security;


  create table "public"."quotes" (
    "id" uuid not null default gen_random_uuid(),
    "inquiry_id" uuid,
    "supplier_id" uuid not null,
    "buyer_id" uuid not null,
    "product_id" uuid,
    "unit_price" numeric(12,2) not null,
    "currency" text not null default 'INR'::text,
    "quantity" integer not null,
    "lead_time_days" integer not null default 14,
    "valid_until" date,
    "is_sample" boolean not null default false,
    "notes" text,
    "status" text not null default 'sent'::text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."quotes" enable row level security;

CREATE INDEX order_events_order_idx ON public.order_events USING btree (order_id, created_at);

CREATE UNIQUE INDEX order_events_pkey ON public.order_events USING btree (id);

CREATE INDEX orders_buyer_idx ON public.orders USING btree (buyer_id, created_at DESC);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE INDEX orders_status_idx ON public.orders USING btree (status);

CREATE INDEX orders_supplier_idx ON public.orders USING btree (supplier_id, created_at DESC);

CREATE UNIQUE INDEX payments_one_per_order_idx ON public.payments USING btree (order_id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE INDEX payments_status_idx ON public.payments USING btree (status);

CREATE INDEX quotes_buyer_idx ON public.quotes USING btree (buyer_id, created_at DESC);

CREATE INDEX quotes_inquiry_idx ON public.quotes USING btree (inquiry_id);

CREATE UNIQUE INDEX quotes_pkey ON public.quotes USING btree (id);

CREATE INDEX quotes_supplier_idx ON public.quotes USING btree (supplier_id, created_at DESC);

alter table "public"."order_events" add constraint "order_events_pkey" PRIMARY KEY using index "order_events_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."quotes" add constraint "quotes_pkey" PRIMARY KEY using index "quotes_pkey";

alter table "public"."order_events" add constraint "order_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."order_events" validate constraint "order_events_actor_user_id_fkey";

alter table "public"."order_events" add constraint "order_events_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_events" validate constraint "order_events_order_id_fkey";

alter table "public"."orders" add constraint "orders_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_buyer_id_fkey";

alter table "public"."orders" add constraint "orders_commission_rate_bps_check" CHECK (((commission_rate_bps >= 0) AND (commission_rate_bps <= 10000))) not valid;

alter table "public"."orders" validate constraint "orders_commission_rate_bps_check";

alter table "public"."orders" add constraint "orders_inquiry_id_fkey" FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_inquiry_id_fkey";

alter table "public"."orders" add constraint "orders_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_product_id_fkey";

alter table "public"."orders" add constraint "orders_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."orders" validate constraint "orders_quantity_check";

alter table "public"."orders" add constraint "orders_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_quote_id_fkey";

alter table "public"."orders" add constraint "orders_status_check" CHECK ((status = ANY (ARRAY['pending_confirmation'::text, 'confirmed'::text, 'awaiting_payment'::text, 'paid'::text, 'in_production'::text, 'shipped'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_status_check";

alter table "public"."orders" add constraint "orders_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_supplier_id_fkey";

alter table "public"."orders" add constraint "orders_total_amount_check" CHECK ((total_amount >= (0)::numeric)) not valid;

alter table "public"."orders" validate constraint "orders_total_amount_check";

alter table "public"."payments" add constraint "payments_amount_check" CHECK ((amount >= (0)::numeric)) not valid;

alter table "public"."payments" validate constraint "payments_amount_check";

alter table "public"."payments" add constraint "payments_marked_paid_by_fkey" FOREIGN KEY (marked_paid_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_marked_paid_by_fkey";

alter table "public"."payments" add constraint "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_order_id_fkey";

alter table "public"."payments" add constraint "payments_provider_check" CHECK ((provider = ANY (ARRAY['fake'::text, 'stripe'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_provider_check";

alter table "public"."payments" add constraint "payments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_status_check";

alter table "public"."quotes" add constraint "quotes_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."quotes" validate constraint "quotes_buyer_id_fkey";

alter table "public"."quotes" add constraint "quotes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."quotes" validate constraint "quotes_created_by_fkey";

alter table "public"."quotes" add constraint "quotes_inquiry_id_fkey" FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL not valid;

alter table "public"."quotes" validate constraint "quotes_inquiry_id_fkey";

alter table "public"."quotes" add constraint "quotes_lead_time_days_check" CHECK ((lead_time_days >= 0)) not valid;

alter table "public"."quotes" validate constraint "quotes_lead_time_days_check";

alter table "public"."quotes" add constraint "quotes_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."quotes" validate constraint "quotes_product_id_fkey";

alter table "public"."quotes" add constraint "quotes_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."quotes" validate constraint "quotes_quantity_check";

alter table "public"."quotes" add constraint "quotes_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'accepted'::text, 'rejected'::text, 'expired'::text]))) not valid;

alter table "public"."quotes" validate constraint "quotes_status_check";

alter table "public"."quotes" add constraint "quotes_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."quotes" validate constraint "quotes_supplier_id_fkey";

alter table "public"."quotes" add constraint "quotes_unit_price_check" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."quotes" validate constraint "quotes_unit_price_check";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_quote(p_quote_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_quote public.quotes%ROWTYPE;
  v_order_id uuid;
  v_commission integer;
  v_total numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote not found');
  END IF;
  IF v_quote.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not your quote');
  END IF;
  IF v_quote.status <> 'sent' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote is not open for accept');
  END IF;
  IF v_quote.valid_until IS NOT NULL AND v_quote.valid_until < current_date THEN
    UPDATE public.quotes SET status = 'expired', updated_at = now() WHERE id = p_quote_id;
    RETURN jsonb_build_object('ok', false, 'error', 'Quote expired');
  END IF;

  SELECT commission_rate_bps INTO v_commission
  FROM public.suppliers WHERE id = v_quote.supplier_id;
  v_commission := coalesce(v_commission, 500);
  v_total := round(v_quote.unit_price * v_quote.quantity, 2);

  UPDATE public.quotes SET status = 'accepted', updated_at = now() WHERE id = p_quote_id;

  INSERT INTO public.orders (
    quote_id, inquiry_id, buyer_id, supplier_id, product_id,
    total_amount, currency, quantity, is_sample, status, commission_rate_bps
  ) VALUES (
    v_quote.id, v_quote.inquiry_id, v_quote.buyer_id, v_quote.supplier_id, v_quote.product_id,
    v_total, v_quote.currency, v_quote.quantity, v_quote.is_sample,
    'awaiting_payment', v_commission
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (v_order_id, null, 'awaiting_payment', 'Buyer accepted quote', v_uid);

  INSERT INTO public.payments (order_id, provider, amount, currency, status, notes)
  VALUES (
    v_order_id, 'fake', v_total, v_quote.currency, 'pending',
    'TEST MODE — fake payment slab until Stripe (Phase 10)'
  );

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_quote(p_inquiry_id uuid, p_unit_price numeric, p_quantity integer, p_lead_time_days integer, p_valid_until date, p_notes text, p_is_sample boolean DEFAULT false, p_currency text DEFAULT 'INR'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_inq public.inquiries%ROWTYPE;
  v_supplier_id uuid;
  v_quote_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_inq FROM public.inquiries WHERE id = p_inquiry_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Inquiry not found');
  END IF;

  IF v_inq.supplier_id IS NULL OR v_inq.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Inquiry missing buyer or supplier');
  END IF;

  SELECT id INTO v_supplier_id
  FROM public.suppliers
  WHERE id = v_inq.supplier_id AND owner_id = v_uid;
  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not your inquiry');
  END IF;

  IF p_unit_price IS NULL OR p_unit_price < 0 OR p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Price and quantity required');
  END IF;

  INSERT INTO public.quotes (
    inquiry_id, supplier_id, buyer_id, product_id,
    unit_price, currency, quantity, lead_time_days, valid_until,
    is_sample, notes, status, created_by
  ) VALUES (
    p_inquiry_id, v_supplier_id, v_inq.user_id, v_inq.product_id,
    p_unit_price, coalesce(nullif(trim(p_currency), ''), 'INR'), p_quantity,
    coalesce(p_lead_time_days, 14), p_valid_until,
    coalesce(p_is_sample, false), nullif(trim(p_notes), ''), 'sent', v_uid
  )
  RETURNING id INTO v_quote_id;

  RETURN jsonb_build_object('ok', true, 'quote_id', v_quote_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fake_mark_order_paid(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_from text;
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

  UPDATE public.payments
  SET status = 'paid',
      marked_paid_by = v_uid,
      marked_paid_at = now(),
      notes = coalesce(notes, '') || ' · marked paid via fake slab',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  UPDATE public.orders
  SET status = 'paid', updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_from, 'paid', 'TEST MODE fake payment — not real money', v_uid);

  RETURN jsonb_build_object('ok', true, 'mode', 'fake');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reject_quote(p_quote_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_quote public.quotes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;
  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND OR v_quote.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote not found');
  END IF;
  IF v_quote.status <> 'sent' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote is not open');
  END IF;
  UPDATE public.quotes SET status = 'rejected', updated_at = now() WHERE id = p_quote_id;
  RETURN jsonb_build_object('ok', true);
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
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF NOT (
    public.is_active_staff()
    OR EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Seller or staff only');
  END IF;

  IF p_to_status = 'cancelled' AND v_order.status NOT IN ('completed', 'cancelled') THEN
    v_allowed := true;
  ELSIF v_order.status = 'paid' AND p_to_status = 'in_production' THEN
    v_allowed := true;
  ELSIF v_order.status = 'in_production' AND p_to_status = 'shipped' THEN
    v_allowed := true;
  ELSIF v_order.status = 'shipped' AND p_to_status = 'delivered' THEN
    v_allowed := true;
  ELSIF v_order.status = 'delivered' AND p_to_status = 'completed' THEN
    v_allowed := true;
  ELSIF v_order.status = 'awaiting_payment' AND p_to_status = 'confirmed' THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid status transition');
  END IF;

  UPDATE public.orders SET status = p_to_status, updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_order.status, p_to_status, nullif(trim(p_note), ''), v_uid);

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

grant delete on table "public"."order_events" to "anon";

grant insert on table "public"."order_events" to "anon";

grant references on table "public"."order_events" to "anon";

grant select on table "public"."order_events" to "anon";

grant trigger on table "public"."order_events" to "anon";

grant truncate on table "public"."order_events" to "anon";

grant update on table "public"."order_events" to "anon";

grant delete on table "public"."order_events" to "authenticated";

grant insert on table "public"."order_events" to "authenticated";

grant references on table "public"."order_events" to "authenticated";

grant select on table "public"."order_events" to "authenticated";

grant trigger on table "public"."order_events" to "authenticated";

grant truncate on table "public"."order_events" to "authenticated";

grant update on table "public"."order_events" to "authenticated";

grant delete on table "public"."order_events" to "service_role";

grant insert on table "public"."order_events" to "service_role";

grant references on table "public"."order_events" to "service_role";

grant select on table "public"."order_events" to "service_role";

grant trigger on table "public"."order_events" to "service_role";

grant truncate on table "public"."order_events" to "service_role";

grant update on table "public"."order_events" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."quotes" to "anon";

grant insert on table "public"."quotes" to "anon";

grant references on table "public"."quotes" to "anon";

grant select on table "public"."quotes" to "anon";

grant trigger on table "public"."quotes" to "anon";

grant truncate on table "public"."quotes" to "anon";

grant update on table "public"."quotes" to "anon";

grant delete on table "public"."quotes" to "authenticated";

grant insert on table "public"."quotes" to "authenticated";

grant references on table "public"."quotes" to "authenticated";

grant select on table "public"."quotes" to "authenticated";

grant trigger on table "public"."quotes" to "authenticated";

grant truncate on table "public"."quotes" to "authenticated";

grant update on table "public"."quotes" to "authenticated";

grant delete on table "public"."quotes" to "service_role";

grant insert on table "public"."quotes" to "service_role";

grant references on table "public"."quotes" to "service_role";

grant select on table "public"."quotes" to "service_role";

grant trigger on table "public"."quotes" to "service_role";

grant truncate on table "public"."quotes" to "service_role";

grant update on table "public"."quotes" to "service_role";


  create policy "inquiries_select_supplier"
  on "public"."inquiries"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = inquiries.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()));



  create policy "order_events_insert"
  on "public"."order_events"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_events.order_id) AND ((o.buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
           FROM public.suppliers s
          WHERE ((s.id = o.supplier_id) AND (s.owner_id = auth.uid())))))))));



  create policy "order_events_select"
  on "public"."order_events"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_events.order_id) AND ((o.buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
           FROM public.suppliers s
          WHERE ((s.id = o.supplier_id) AND (s.owner_id = auth.uid())))))))));



  create policy "orders_select"
  on "public"."orders"
  as permissive
  for select
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = orders.supplier_id) AND (s.owner_id = auth.uid()))))));



  create policy "orders_update_parties"
  on "public"."orders"
  as permissive
  for update
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = orders.supplier_id) AND (s.owner_id = auth.uid()))))))
with check (((buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = orders.supplier_id) AND (s.owner_id = auth.uid()))))));



  create policy "payments_select"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = payments.order_id) AND ((o.buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
           FROM public.suppliers s
          WHERE ((s.id = o.supplier_id) AND (s.owner_id = auth.uid())))))))));



  create policy "quotes_insert_seller"
  on "public"."quotes"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = quotes.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "quotes_select"
  on "public"."quotes"
  as permissive
  for select
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = quotes.supplier_id) AND (s.owner_id = auth.uid()))))));



  create policy "quotes_update_parties"
  on "public"."quotes"
  as permissive
  for update
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = quotes.supplier_id) AND (s.owner_id = auth.uid()))))))
with check (((buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = quotes.supplier_id) AND (s.owner_id = auth.uid()))))));


CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();




-- Function grants (migra often skips these)
grant execute on function public.create_quote(uuid, numeric, integer, integer, date, text, boolean, text) to authenticated;
grant execute on function public.accept_quote(uuid) to authenticated;
grant execute on function public.reject_quote(uuid) to authenticated;
grant execute on function public.fake_mark_order_paid(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
