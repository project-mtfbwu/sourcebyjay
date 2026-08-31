drop policy "inquiries_select_supplier" on "public"."inquiries";

alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";


  create table "public"."inquiry_suppliers" (
    "inquiry_id" uuid not null,
    "supplier_id" uuid not null,
    "product_id" uuid,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."inquiry_suppliers" enable row level security;

alter table "public"."inquiries" add column "is_broadcast" boolean not null default false;

alter table "public"."inquiries" add column "title" text;

CREATE INDEX inquiry_suppliers_inquiry_idx ON public.inquiry_suppliers USING btree (inquiry_id);

CREATE UNIQUE INDEX inquiry_suppliers_pkey ON public.inquiry_suppliers USING btree (inquiry_id, supplier_id);

CREATE INDEX inquiry_suppliers_supplier_idx ON public.inquiry_suppliers USING btree (supplier_id, created_at DESC);

alter table "public"."inquiry_suppliers" add constraint "inquiry_suppliers_pkey" PRIMARY KEY using index "inquiry_suppliers_pkey";

alter table "public"."inquiry_suppliers" add constraint "inquiry_suppliers_inquiry_id_fkey" FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE CASCADE not valid;

alter table "public"."inquiry_suppliers" validate constraint "inquiry_suppliers_inquiry_id_fkey";

alter table "public"."inquiry_suppliers" add constraint "inquiry_suppliers_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."inquiry_suppliers" validate constraint "inquiry_suppliers_product_id_fkey";

alter table "public"."inquiry_suppliers" add constraint "inquiry_suppliers_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'quoted'::text, 'declined'::text, 'skipped_quota'::text]))) not valid;

alter table "public"."inquiry_suppliers" validate constraint "inquiry_suppliers_status_check";

alter table "public"."inquiry_suppliers" add constraint "inquiry_suppliers_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."inquiry_suppliers" validate constraint "inquiry_suppliers_supplier_id_fkey";

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
  IF v_count > 8 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Maximum 8 suppliers per RFQ');
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

CREATE OR REPLACE FUNCTION public.supplier_rfq_leads_this_week(p_supplier_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT count(*)::integer
  FROM public.inquiry_suppliers
  WHERE supplier_id = p_supplier_id
    AND status <> 'skipped_quota'
    AND created_at >= (now() - interval '7 days');
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
  v_product_id uuid;
  v_quote_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
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

  SELECT product_id INTO v_product_id
  FROM public.inquiry_suppliers
  WHERE inquiry_id = p_inquiry_id AND supplier_id = v_supplier_id;

  v_product_id := coalesce(v_product_id, v_inq.product_id);

  INSERT INTO public.quotes (
    inquiry_id, supplier_id, buyer_id, product_id,
    unit_price, currency, quantity, lead_time_days, valid_until,
    is_sample, notes, status, created_by
  ) VALUES (
    p_inquiry_id, v_supplier_id, v_inq.user_id, v_product_id,
    p_unit_price, coalesce(nullif(trim(p_currency), ''), 'INR'), p_quantity,
    coalesce(p_lead_time_days, 14), p_valid_until,
    coalesce(p_is_sample, false), nullif(trim(p_notes), ''), 'sent', v_uid
  )
  RETURNING id INTO v_quote_id;

  UPDATE public.inquiry_suppliers
  SET status = 'quoted'
  WHERE inquiry_id = p_inquiry_id AND supplier_id = v_supplier_id;

  RETURN jsonb_build_object('ok', true, 'quote_id', v_quote_id);
END;
$function$
;

grant delete on table "public"."inquiry_suppliers" to "anon";

grant insert on table "public"."inquiry_suppliers" to "anon";

grant references on table "public"."inquiry_suppliers" to "anon";

grant select on table "public"."inquiry_suppliers" to "anon";

grant trigger on table "public"."inquiry_suppliers" to "anon";

grant truncate on table "public"."inquiry_suppliers" to "anon";

grant update on table "public"."inquiry_suppliers" to "anon";

grant delete on table "public"."inquiry_suppliers" to "authenticated";

grant insert on table "public"."inquiry_suppliers" to "authenticated";

grant references on table "public"."inquiry_suppliers" to "authenticated";

grant select on table "public"."inquiry_suppliers" to "authenticated";

grant trigger on table "public"."inquiry_suppliers" to "authenticated";

grant truncate on table "public"."inquiry_suppliers" to "authenticated";

grant update on table "public"."inquiry_suppliers" to "authenticated";

grant delete on table "public"."inquiry_suppliers" to "service_role";

grant insert on table "public"."inquiry_suppliers" to "service_role";

grant references on table "public"."inquiry_suppliers" to "service_role";

grant select on table "public"."inquiry_suppliers" to "service_role";

grant trigger on table "public"."inquiry_suppliers" to "service_role";

grant truncate on table "public"."inquiry_suppliers" to "service_role";

grant update on table "public"."inquiry_suppliers" to "service_role";


  create policy "inquiry_suppliers_select"
  on "public"."inquiry_suppliers"
  as permissive
  for select
  to authenticated
using ((public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.inquiries i
  WHERE ((i.id = inquiry_suppliers.inquiry_id) AND (i.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = inquiry_suppliers.supplier_id) AND (s.owner_id = auth.uid()))))));



  create policy "inquiries_select_supplier"
  on "public"."inquiries"
  as permissive
  for select
  to authenticated
using ((public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = inquiries.supplier_id) AND (s.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.inquiry_suppliers isup
     JOIN public.suppliers s ON ((s.id = isup.supplier_id)))
  WHERE ((isup.inquiry_id = inquiries.id) AND (s.owner_id = auth.uid()) AND (isup.status <> 'skipped_quota'::text))))));




-- Function grants + Free plan broadcast leads for MVP testing
grant execute on function public.broadcast_rfq(jsonb, text, integer, text, text) to authenticated;
grant execute on function public.supplier_rfq_leads_this_week(uuid) to authenticated;
update public.listing_plans set rfq_leads_per_week = 2 where slug = 'free';
