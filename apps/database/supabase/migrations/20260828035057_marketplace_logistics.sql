alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

drop function if exists "public"."create_quote"(p_inquiry_id uuid, p_unit_price numeric, p_quantity integer, p_lead_time_days integer, p_valid_until date, p_notes text, p_is_sample boolean, p_currency text);


  create table "public"."shipping_zone_pins" (
    "pin_prefix" text not null,
    "zone_code" text not null,
    "label" text not null
      );


alter table "public"."shipping_zone_pins" enable row level security;

alter table "public"."orders" add column "destination_pincode" text;

alter table "public"."orders" add column "estimated_weight_kg" numeric(10,3);

alter table "public"."orders" add column "freight_amount" numeric(12,2) not null default 0;

alter table "public"."orders" add column "incoterm" text not null default 'FOB'::text;

alter table "public"."orders" add column "product_subtotal" numeric(14,2);

alter table "public"."orders" add column "ship_by_date" date;

alter table "public"."orders" add column "shipping_zone" text;

alter table "public"."quotes" add column "destination_pincode" text;

alter table "public"."quotes" add column "estimated_weight_kg" numeric(10,3);

alter table "public"."quotes" add column "freight_amount" numeric(12,2) not null default 0;

alter table "public"."quotes" add column "incoterm" text not null default 'FOB'::text;

alter table "public"."quotes" add column "ship_by_date" date;

alter table "public"."quotes" add column "shipping_zone" text;

CREATE UNIQUE INDEX shipping_zone_pins_pkey ON public.shipping_zone_pins USING btree (pin_prefix);

alter table "public"."shipping_zone_pins" add constraint "shipping_zone_pins_pkey" PRIMARY KEY using index "shipping_zone_pins_pkey";

alter table "public"."orders" add constraint "orders_freight_amount_check" CHECK ((freight_amount >= (0)::numeric)) not valid;

alter table "public"."orders" validate constraint "orders_freight_amount_check";

alter table "public"."orders" add constraint "orders_incoterm_check" CHECK ((incoterm = ANY (ARRAY['EXW'::text, 'FOB'::text, 'CIF'::text, 'CFR'::text, 'DDP'::text, 'DAP'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_incoterm_check";

alter table "public"."quotes" add constraint "quotes_freight_amount_check" CHECK ((freight_amount >= (0)::numeric)) not valid;

alter table "public"."quotes" validate constraint "quotes_freight_amount_check";

alter table "public"."quotes" add constraint "quotes_incoterm_check" CHECK ((incoterm = ANY (ARRAY['EXW'::text, 'FOB'::text, 'CIF'::text, 'CFR'::text, 'DDP'::text, 'DAP'::text]))) not valid;

alter table "public"."quotes" validate constraint "quotes_incoterm_check";

alter table "public"."shipping_zone_pins" add constraint "shipping_zone_pins_zone_code_check" CHECK ((zone_code = ANY (ARRAY['metro'::text, 'north'::text, 'west'::text, 'south'::text, 'east'::text, 'northeast'::text, 'intl'::text]))) not valid;

alter table "public"."shipping_zone_pins" validate constraint "shipping_zone_pins_zone_code_check";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_quote(p_inquiry_id uuid, p_unit_price numeric, p_quantity integer, p_lead_time_days integer, p_valid_until date, p_notes text, p_is_sample boolean DEFAULT false, p_currency text DEFAULT 'INR'::text, p_incoterm text DEFAULT 'FOB'::text, p_freight_amount numeric DEFAULT 0, p_destination_pincode text DEFAULT NULL::text, p_estimated_weight_kg numeric DEFAULT NULL::numeric, p_ship_by_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_inq public.inquiries%ROWTYPE;
  v_supplier_id uuid;
  v_product_id uuid;
  v_quote_id uuid;
  v_zone text;
  v_incoterm text;
  v_freight numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  v_incoterm := upper(coalesce(nullif(trim(p_incoterm), ''), 'FOB'));
  IF v_incoterm NOT IN ('EXW', 'FOB', 'CIF', 'CFR', 'DDP', 'DAP') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid incoterm');
  END IF;

  SELECT * INTO v_inq FROM public.inquiries WHERE id = p_inquiry_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Inquiry not found');
  END IF;

  IF v_inq.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Inquiry missing buyer');
  END IF;

  SELECT s.id INTO v_supplier_id
  FROM public.suppliers s
  WHERE s.owner_id = v_uid
    AND (
      s.id = v_inq.supplier_id
      OR EXISTS (
        SELECT 1 FROM public.inquiry_suppliers isup
        WHERE isup.inquiry_id = p_inquiry_id
          AND isup.supplier_id = s.id
          AND isup.status IN ('pending', 'quoted')
      )
    )
  LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not your inquiry');
  END IF;

  IF p_unit_price IS NULL OR p_unit_price < 0 OR p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Price and quantity required');
  END IF;

  v_freight := greatest(coalesce(p_freight_amount, 0), 0);
  v_zone := public.resolve_shipping_zone(p_destination_pincode);

  SELECT product_id INTO v_product_id
  FROM public.inquiry_suppliers
  WHERE inquiry_id = p_inquiry_id AND supplier_id = v_supplier_id;

  v_product_id := coalesce(v_product_id, v_inq.product_id);

  INSERT INTO public.quotes (
    inquiry_id, supplier_id, buyer_id, product_id,
    unit_price, currency, quantity, lead_time_days, valid_until,
    is_sample, notes, status, created_by,
    incoterm, freight_amount, destination_pincode, shipping_zone,
    estimated_weight_kg, ship_by_date
  ) VALUES (
    p_inquiry_id, v_supplier_id, v_inq.user_id, v_product_id,
    p_unit_price, coalesce(nullif(trim(p_currency), ''), 'INR'), p_quantity,
    coalesce(p_lead_time_days, 14), p_valid_until,
    coalesce(p_is_sample, false), nullif(trim(p_notes), ''), 'sent', v_uid,
    v_incoterm, v_freight, nullif(trim(p_destination_pincode), ''), v_zone,
    p_estimated_weight_kg, p_ship_by_date
  )
  RETURNING id INTO v_quote_id;

  UPDATE public.inquiry_suppliers
  SET status = 'quoted'
  WHERE inquiry_id = p_inquiry_id AND supplier_id = v_supplier_id;

  RETURN jsonb_build_object(
    'ok', true,
    'quote_id', v_quote_id,
    'shipping_zone', v_zone,
    'freight_amount', v_freight,
    'incoterm', v_incoterm
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.estimate_freight_inr(p_weight_kg numeric, p_pincode text DEFAULT NULL::text, p_international boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_weight numeric;
  v_zone text;
  v_rate_per_kg numeric;
  v_min_charge numeric;
  v_amount numeric;
BEGIN
  v_weight := greatest(coalesce(p_weight_kg, 1), 0.1);

  IF coalesce(p_international, false) THEN
    v_zone := 'intl';
    v_rate_per_kg := 180;
    v_min_charge := 3500;
  ELSE
    v_zone := public.resolve_shipping_zone(p_pincode);
    v_rate_per_kg := CASE v_zone
      WHEN 'metro' THEN 42
      WHEN 'north' THEN 52
      WHEN 'west' THEN 48
      WHEN 'south' THEN 50
      WHEN 'east' THEN 55
      WHEN 'northeast' THEN 62
      ELSE 58
    END;
    v_min_charge := CASE v_zone
      WHEN 'metro' THEN 199
      WHEN 'northeast' THEN 349
      ELSE 249
    END;
  END IF;

  v_amount := greatest(round(v_weight * v_rate_per_kg, 2), v_min_charge);

  RETURN jsonb_build_object(
    'ok', true,
    'zone', v_zone,
    'weight_kg', v_weight,
    'rate_per_kg', v_rate_per_kg,
    'min_charge', v_min_charge,
    'freight_amount', v_amount,
    'currency', 'INR',
    'pincode', nullif(trim(p_pincode), '')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_shipping_zone(p_pincode text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_digits text;
  v_prefix3 text;
  v_zone text;
  v_first text;
BEGIN
  v_digits := regexp_replace(coalesce(p_pincode, ''), '\D', '', 'g');
  IF length(v_digits) < 3 THEN
    RETURN 'unknown';
  END IF;

  v_prefix3 := left(v_digits, 3);
  SELECT zone_code INTO v_zone
  FROM public.shipping_zone_pins
  WHERE pin_prefix = v_prefix3
  LIMIT 1;
  IF v_zone IS NOT NULL THEN
    RETURN v_zone;
  END IF;

  v_first := left(v_digits, 1);
  RETURN CASE
    WHEN v_first IN ('1', '2') THEN 'north'
    WHEN v_first IN ('3', '4') THEN 'west'
    WHEN v_first IN ('5', '6') THEN 'south'
    WHEN v_first = '7' THEN 'east'
    WHEN v_first IN ('8', '9') THEN 'northeast'
    ELSE 'unknown'
  END;
END;
$function$
;

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
  v_subtotal numeric;
  v_freight numeric;
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
  v_subtotal := round(v_quote.unit_price * v_quote.quantity, 2);
  v_freight := coalesce(v_quote.freight_amount, 0);
  v_total := round(v_subtotal + v_freight, 2);

  UPDATE public.quotes SET status = 'accepted', updated_at = now() WHERE id = p_quote_id;

  INSERT INTO public.orders (
    quote_id, inquiry_id, buyer_id, supplier_id, product_id,
    total_amount, currency, quantity, is_sample, status, commission_rate_bps,
    incoterm, freight_amount, product_subtotal, destination_pincode,
    shipping_zone, estimated_weight_kg, ship_by_date
  ) VALUES (
    v_quote.id, v_quote.inquiry_id, v_quote.buyer_id, v_quote.supplier_id, v_quote.product_id,
    v_total, v_quote.currency, v_quote.quantity, v_quote.is_sample,
    'awaiting_payment', v_commission,
    v_quote.incoterm, v_freight, v_subtotal, v_quote.destination_pincode,
    v_quote.shipping_zone, v_quote.estimated_weight_kg, v_quote.ship_by_date
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    v_order_id, null, 'awaiting_payment',
    format('Buyer accepted quote (%s · freight ₹%s)', v_quote.incoterm, v_freight),
    v_uid
  );

  INSERT INTO public.payments (order_id, provider, amount, currency, status, notes)
  VALUES (
    v_order_id, 'fake', v_total, v_quote.currency, 'pending',
    'TEST MODE — fake payment slab until Stripe (Phase 10)'
  );

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'total_amount', v_total);
END;
$function$
;

grant delete on table "public"."shipping_zone_pins" to "anon";

grant insert on table "public"."shipping_zone_pins" to "anon";

grant references on table "public"."shipping_zone_pins" to "anon";

grant select on table "public"."shipping_zone_pins" to "anon";

grant trigger on table "public"."shipping_zone_pins" to "anon";

grant truncate on table "public"."shipping_zone_pins" to "anon";

grant update on table "public"."shipping_zone_pins" to "anon";

grant delete on table "public"."shipping_zone_pins" to "authenticated";

grant insert on table "public"."shipping_zone_pins" to "authenticated";

grant references on table "public"."shipping_zone_pins" to "authenticated";

grant select on table "public"."shipping_zone_pins" to "authenticated";

grant trigger on table "public"."shipping_zone_pins" to "authenticated";

grant truncate on table "public"."shipping_zone_pins" to "authenticated";

grant update on table "public"."shipping_zone_pins" to "authenticated";

grant delete on table "public"."shipping_zone_pins" to "service_role";

grant insert on table "public"."shipping_zone_pins" to "service_role";

grant references on table "public"."shipping_zone_pins" to "service_role";

grant select on table "public"."shipping_zone_pins" to "service_role";

grant trigger on table "public"."shipping_zone_pins" to "service_role";

grant truncate on table "public"."shipping_zone_pins" to "service_role";

grant update on table "public"."shipping_zone_pins" to "service_role";


  create policy "shipping_zone_pins_select"
  on "public"."shipping_zone_pins"
  as permissive
  for select
  to anon, authenticated
using (true);



