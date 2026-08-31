
  create table "public"."buyer_favorites" (
    "id" uuid not null default gen_random_uuid(),
    "buyer_id" uuid not null,
    "kind" text not null,
    "product_id" uuid,
    "supplier_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."buyer_favorites" enable row level security;


  create table "public"."listing_request_offers" (
    "id" uuid not null default gen_random_uuid(),
    "listing_request_id" uuid not null,
    "supplier_id" uuid not null,
    "message" text not null,
    "unit_price" numeric(12,2),
    "currency" text not null default 'INR'::text,
    "lead_time_days" integer,
    "status" text not null default 'submitted'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."listing_request_offers" enable row level security;


  create table "public"."listing_requests" (
    "id" uuid not null default gen_random_uuid(),
    "buyer_id" uuid not null,
    "title" text not null,
    "description" text not null,
    "quantity" integer,
    "category_hint" text,
    "contact_email" text not null,
    "status" text not null default 'open'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."listing_requests" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "buyer_id" uuid not null,
    "order_id" uuid not null,
    "product_id" uuid,
    "supplier_id" uuid not null,
    "rating" integer not null,
    "title" text,
    "body" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."reviews" enable row level security;

CREATE INDEX buyer_favorites_buyer_idx ON public.buyer_favorites USING btree (buyer_id, created_at DESC);

CREATE UNIQUE INDEX buyer_favorites_pkey ON public.buyer_favorites USING btree (id);

CREATE UNIQUE INDEX buyer_favorites_product_unique ON public.buyer_favorites USING btree (buyer_id, product_id) WHERE (kind = 'product'::text);

CREATE UNIQUE INDEX buyer_favorites_supplier_unique ON public.buyer_favorites USING btree (buyer_id, supplier_id) WHERE (kind = 'supplier'::text);

CREATE UNIQUE INDEX listing_request_offers_pkey ON public.listing_request_offers USING btree (id);

CREATE INDEX listing_request_offers_request_idx ON public.listing_request_offers USING btree (listing_request_id, created_at DESC);

CREATE INDEX listing_request_offers_supplier_idx ON public.listing_request_offers USING btree (supplier_id, created_at DESC);

CREATE UNIQUE INDEX listing_request_offers_unique ON public.listing_request_offers USING btree (listing_request_id, supplier_id);

CREATE INDEX listing_requests_buyer_idx ON public.listing_requests USING btree (buyer_id, created_at DESC);

CREATE UNIQUE INDEX listing_requests_pkey ON public.listing_requests USING btree (id);

CREATE INDEX listing_requests_status_idx ON public.listing_requests USING btree (status, created_at DESC);

CREATE UNIQUE INDEX reviews_one_per_order ON public.reviews USING btree (order_id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE INDEX reviews_product_idx ON public.reviews USING btree (product_id, created_at DESC);

CREATE INDEX reviews_supplier_idx ON public.reviews USING btree (supplier_id, created_at DESC);

alter table "public"."buyer_favorites" add constraint "buyer_favorites_pkey" PRIMARY KEY using index "buyer_favorites_pkey";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_pkey" PRIMARY KEY using index "listing_request_offers_pkey";

alter table "public"."listing_requests" add constraint "listing_requests_pkey" PRIMARY KEY using index "listing_requests_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."buyer_favorites" add constraint "buyer_favorites_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."buyer_favorites" validate constraint "buyer_favorites_buyer_id_fkey";

alter table "public"."buyer_favorites" add constraint "buyer_favorites_kind_check" CHECK ((kind = ANY (ARRAY['product'::text, 'supplier'::text]))) not valid;

alter table "public"."buyer_favorites" validate constraint "buyer_favorites_kind_check";

alter table "public"."buyer_favorites" add constraint "buyer_favorites_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."buyer_favorites" validate constraint "buyer_favorites_product_id_fkey";

alter table "public"."buyer_favorites" add constraint "buyer_favorites_product_shape" CHECK ((((kind = 'product'::text) AND (product_id IS NOT NULL)) OR ((kind = 'supplier'::text) AND (product_id IS NULL)))) not valid;

alter table "public"."buyer_favorites" validate constraint "buyer_favorites_product_shape";

alter table "public"."buyer_favorites" add constraint "buyer_favorites_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."buyer_favorites" validate constraint "buyer_favorites_supplier_id_fkey";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_lead_time_days_check" CHECK (((lead_time_days IS NULL) OR (lead_time_days >= 0))) not valid;

alter table "public"."listing_request_offers" validate constraint "listing_request_offers_lead_time_days_check";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_listing_request_id_fkey" FOREIGN KEY (listing_request_id) REFERENCES public.listing_requests(id) ON DELETE CASCADE not valid;

alter table "public"."listing_request_offers" validate constraint "listing_request_offers_listing_request_id_fkey";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_message_check" CHECK (((char_length(TRIM(BOTH FROM message)) >= 10) AND (char_length(message) <= 2000))) not valid;

alter table "public"."listing_request_offers" validate constraint "listing_request_offers_message_check";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_status_check" CHECK ((status = ANY (ARRAY['submitted'::text, 'withdrawn'::text]))) not valid;

alter table "public"."listing_request_offers" validate constraint "listing_request_offers_status_check";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."listing_request_offers" validate constraint "listing_request_offers_supplier_id_fkey";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_unique" UNIQUE using index "listing_request_offers_unique";

alter table "public"."listing_request_offers" add constraint "listing_request_offers_unit_price_check" CHECK (((unit_price IS NULL) OR (unit_price >= (0)::numeric))) not valid;

alter table "public"."listing_request_offers" validate constraint "listing_request_offers_unit_price_check";

alter table "public"."listing_requests" add constraint "listing_requests_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."listing_requests" validate constraint "listing_requests_buyer_id_fkey";

alter table "public"."listing_requests" add constraint "listing_requests_category_hint_check" CHECK (((category_hint IS NULL) OR (char_length(category_hint) <= 120))) not valid;

alter table "public"."listing_requests" validate constraint "listing_requests_category_hint_check";

alter table "public"."listing_requests" add constraint "listing_requests_description_check" CHECK (((char_length(TRIM(BOTH FROM description)) >= 20) AND (char_length(description) <= 4000))) not valid;

alter table "public"."listing_requests" validate constraint "listing_requests_description_check";

alter table "public"."listing_requests" add constraint "listing_requests_quantity_check" CHECK (((quantity IS NULL) OR (quantity > 0))) not valid;

alter table "public"."listing_requests" validate constraint "listing_requests_quantity_check";

alter table "public"."listing_requests" add constraint "listing_requests_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'cancelled'::text]))) not valid;

alter table "public"."listing_requests" validate constraint "listing_requests_status_check";

alter table "public"."listing_requests" add constraint "listing_requests_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 5) AND (char_length(title) <= 200))) not valid;

alter table "public"."listing_requests" validate constraint "listing_requests_title_check";

alter table "public"."reviews" add constraint "reviews_body_check" CHECK (((char_length(TRIM(BOTH FROM body)) >= 10) AND (char_length(body) <= 2000))) not valid;

alter table "public"."reviews" validate constraint "reviews_body_check";

alter table "public"."reviews" add constraint "reviews_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_buyer_id_fkey";

alter table "public"."reviews" add constraint "reviews_one_per_order" UNIQUE using index "reviews_one_per_order";

alter table "public"."reviews" add constraint "reviews_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_order_id_fkey";

alter table "public"."reviews" add constraint "reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."reviews" validate constraint "reviews_product_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_supplier_id_fkey";

alter table "public"."reviews" add constraint "reviews_title_check" CHECK (((title IS NULL) OR (char_length(TRIM(BOTH FROM title)) <= 120))) not valid;

alter table "public"."reviews" validate constraint "reviews_title_check";


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_listing_request(p_title text, p_description text, p_contact_email text, p_quantity integer DEFAULT NULL::integer, p_category_hint text DEFAULT NULL::text)
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
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_title IS NULL OR char_length(trim(p_title)) < 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'title_too_short');
  END IF;
  IF p_description IS NULL OR char_length(trim(p_description)) < 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'description_too_short');
  END IF;
  IF p_contact_email IS NULL OR position('@' in p_contact_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  INSERT INTO public.listing_requests (
    buyer_id, title, description, quantity, category_hint, contact_email
  ) VALUES (
    v_uid,
    trim(p_title),
    trim(p_description),
    p_quantity,
    NULLIF(trim(COALESCE(p_category_hint, '')), ''),
    lower(trim(p_contact_email))
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'listing_request_id', v_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_verified_review(p_order_id uuid, p_rating integer, p_body text, p_title text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_rating');
  END IF;
  IF p_body IS NULL OR char_length(trim(p_body)) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'body_too_short');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_found');
  END IF;
  IF v_order.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_your_order');
  END IF;
  IF v_order.status <> 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_completed');
  END IF;
  IF EXISTS (SELECT 1 FROM public.reviews WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_reviewed');
  END IF;

  INSERT INTO public.reviews (
    buyer_id, order_id, product_id, supplier_id, rating, title, body
  ) VALUES (
    v_uid,
    p_order_id,
    v_order.product_id,
    v_order.supplier_id,
    p_rating,
    NULLIF(trim(COALESCE(p_title, '')), ''),
    trim(p_body)
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'review_id', v_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_listing_offer(p_listing_request_id uuid, p_message text, p_unit_price numeric DEFAULT NULL::numeric, p_lead_time_days integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_supplier_id uuid;
  v_status text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT id INTO v_supplier_id
  FROM public.suppliers
  WHERE owner_id = v_uid
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_supplier');
  END IF;

  SELECT status INTO v_status
  FROM public.listing_requests
  WHERE id = p_listing_request_id;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_status <> 'open' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_open');
  END IF;
  IF p_message IS NULL OR char_length(trim(p_message)) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'message_too_short');
  END IF;

  INSERT INTO public.listing_request_offers (
    listing_request_id, supplier_id, message, unit_price, lead_time_days
  ) VALUES (
    p_listing_request_id,
    v_supplier_id,
    trim(p_message),
    p_unit_price,
    p_lead_time_days
  )
  ON CONFLICT (listing_request_id, supplier_id) DO UPDATE
    SET message = EXCLUDED.message,
        unit_price = EXCLUDED.unit_price,
        lead_time_days = EXCLUDED.lead_time_days,
        status = 'submitted',
        created_at = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'offer_id', v_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_buyer_favorite(p_kind text, p_supplier_id uuid, p_product_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_existing uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_kind NOT IN ('product', 'supplier') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind');
  END IF;
  IF p_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'supplier_required');
  END IF;
  IF p_kind = 'product' AND p_product_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'product_required');
  END IF;

  IF p_kind = 'product' THEN
    SELECT id INTO v_existing
    FROM public.buyer_favorites
    WHERE buyer_id = v_uid AND kind = 'product' AND product_id = p_product_id;
  ELSE
    SELECT id INTO v_existing
    FROM public.buyer_favorites
    WHERE buyer_id = v_uid AND kind = 'supplier' AND supplier_id = p_supplier_id;
  END IF;

  IF v_existing IS NOT NULL THEN
    DELETE FROM public.buyer_favorites WHERE id = v_existing;
    RETURN jsonb_build_object('ok', true, 'favorited', false);
  END IF;

  INSERT INTO public.buyer_favorites (buyer_id, kind, product_id, supplier_id)
  VALUES (
    v_uid,
    p_kind,
    CASE WHEN p_kind = 'product' THEN p_product_id ELSE NULL END,
    p_supplier_id
  );

  RETURN jsonb_build_object('ok', true, 'favorited', true);
END;
$function$
;

grant delete on table "public"."buyer_favorites" to "anon";

grant insert on table "public"."buyer_favorites" to "anon";

grant references on table "public"."buyer_favorites" to "anon";

grant select on table "public"."buyer_favorites" to "anon";

grant trigger on table "public"."buyer_favorites" to "anon";

grant truncate on table "public"."buyer_favorites" to "anon";

grant update on table "public"."buyer_favorites" to "anon";

grant delete on table "public"."buyer_favorites" to "authenticated";

grant insert on table "public"."buyer_favorites" to "authenticated";

grant references on table "public"."buyer_favorites" to "authenticated";

grant select on table "public"."buyer_favorites" to "authenticated";

grant trigger on table "public"."buyer_favorites" to "authenticated";

grant truncate on table "public"."buyer_favorites" to "authenticated";

grant update on table "public"."buyer_favorites" to "authenticated";

grant delete on table "public"."buyer_favorites" to "service_role";

grant insert on table "public"."buyer_favorites" to "service_role";

grant references on table "public"."buyer_favorites" to "service_role";

grant select on table "public"."buyer_favorites" to "service_role";

grant trigger on table "public"."buyer_favorites" to "service_role";

grant truncate on table "public"."buyer_favorites" to "service_role";

grant update on table "public"."buyer_favorites" to "service_role";

grant delete on table "public"."listing_request_offers" to "anon";

grant insert on table "public"."listing_request_offers" to "anon";

grant references on table "public"."listing_request_offers" to "anon";

grant select on table "public"."listing_request_offers" to "anon";

grant trigger on table "public"."listing_request_offers" to "anon";

grant truncate on table "public"."listing_request_offers" to "anon";

grant update on table "public"."listing_request_offers" to "anon";

grant delete on table "public"."listing_request_offers" to "authenticated";

grant insert on table "public"."listing_request_offers" to "authenticated";

grant references on table "public"."listing_request_offers" to "authenticated";

grant select on table "public"."listing_request_offers" to "authenticated";

grant trigger on table "public"."listing_request_offers" to "authenticated";

grant truncate on table "public"."listing_request_offers" to "authenticated";

grant update on table "public"."listing_request_offers" to "authenticated";

grant delete on table "public"."listing_request_offers" to "service_role";

grant insert on table "public"."listing_request_offers" to "service_role";

grant references on table "public"."listing_request_offers" to "service_role";

grant select on table "public"."listing_request_offers" to "service_role";

grant trigger on table "public"."listing_request_offers" to "service_role";

grant truncate on table "public"."listing_request_offers" to "service_role";

grant update on table "public"."listing_request_offers" to "service_role";

grant delete on table "public"."listing_requests" to "anon";

grant insert on table "public"."listing_requests" to "anon";

grant references on table "public"."listing_requests" to "anon";

grant select on table "public"."listing_requests" to "anon";

grant trigger on table "public"."listing_requests" to "anon";

grant truncate on table "public"."listing_requests" to "anon";

grant update on table "public"."listing_requests" to "anon";

grant delete on table "public"."listing_requests" to "authenticated";

grant insert on table "public"."listing_requests" to "authenticated";

grant references on table "public"."listing_requests" to "authenticated";

grant select on table "public"."listing_requests" to "authenticated";

grant trigger on table "public"."listing_requests" to "authenticated";

grant truncate on table "public"."listing_requests" to "authenticated";

grant update on table "public"."listing_requests" to "authenticated";

grant delete on table "public"."listing_requests" to "service_role";

grant insert on table "public"."listing_requests" to "service_role";

grant references on table "public"."listing_requests" to "service_role";

grant select on table "public"."listing_requests" to "service_role";

grant trigger on table "public"."listing_requests" to "service_role";

grant truncate on table "public"."listing_requests" to "service_role";

grant update on table "public"."listing_requests" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";


  create policy "buyer_favorites_delete_own"
  on "public"."buyer_favorites"
  as permissive
  for delete
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff()));



  create policy "buyer_favorites_insert_own"
  on "public"."buyer_favorites"
  as permissive
  for insert
  to authenticated
with check ((buyer_id = auth.uid()));



  create policy "buyer_favorites_select_own"
  on "public"."buyer_favorites"
  as permissive
  for select
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff()));



  create policy "listing_request_offers_insert_seller"
  on "public"."listing_request_offers"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = listing_request_offers.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "listing_request_offers_select"
  on "public"."listing_request_offers"
  as permissive
  for select
  to authenticated
using ((public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.listing_requests lr
  WHERE ((lr.id = listing_request_offers.listing_request_id) AND (lr.buyer_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = listing_request_offers.supplier_id) AND (s.owner_id = auth.uid()))))));



  create policy "listing_requests_insert_buyer"
  on "public"."listing_requests"
  as permissive
  for insert
  to authenticated
with check ((buyer_id = auth.uid()));



  create policy "listing_requests_select"
  on "public"."listing_requests"
  as permissive
  for select
  to authenticated
using (((status = 'open'::text) OR (buyer_id = auth.uid()) OR public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE (s.owner_id = auth.uid())))));



  create policy "listing_requests_update_buyer"
  on "public"."listing_requests"
  as permissive
  for update
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff()))
with check (((buyer_id = auth.uid()) OR public.is_active_staff()));



  create policy "reviews_insert_own"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check ((buyer_id = auth.uid()));



  create policy "reviews_select_public"
  on "public"."reviews"
  as permissive
  for select
  to anon, authenticated
using (true);



