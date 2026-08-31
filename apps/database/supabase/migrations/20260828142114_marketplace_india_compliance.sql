create type "public"."supplier_business_type" as enum ('manufacturer', 'trader', 'both');

alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";


  create table "public"."buyer_business_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "buyer_id" uuid not null,
    "label" text not null default 'Default'::text,
    "company_name" text,
    "gstin" text,
    "pan" text,
    "address_line1" text,
    "address_line2" text,
    "city" text,
    "state" text,
    "pincode" text,
    "country" text not null default 'India'::text,
    "is_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."buyer_business_profiles" enable row level security;

alter table "public"."products" add column "gst_rate_bps" integer;

alter table "public"."products" add column "hsn_code" text;

alter table "public"."supplier_certificates" add column "cert_number" text;

alter table "public"."supplier_certificates" add column "cert_type" text not null default 'other'::text;

alter table "public"."supplier_certificates" add column "issuing_authority" text;

alter table "public"."suppliers" add column "business_type" public.supplier_business_type;

alter table "public"."suppliers" add column "employee_count_band" text;

alter table "public"."suppliers" add column "export_markets" jsonb not null default '[]'::jsonb;

alter table "public"."suppliers" add column "msme_udhyam" text;

alter table "public"."suppliers" add column "pan" text;

alter table "public"."suppliers" add column "pincode" text;

alter table "public"."suppliers" add column "state" text;

CREATE INDEX buyer_business_profiles_buyer_idx ON public.buyer_business_profiles USING btree (buyer_id, is_default DESC, created_at DESC);

CREATE UNIQUE INDEX buyer_business_profiles_pkey ON public.buyer_business_profiles USING btree (id);

alter table "public"."buyer_business_profiles" add constraint "buyer_business_profiles_pkey" PRIMARY KEY using index "buyer_business_profiles_pkey";

alter table "public"."buyer_business_profiles" add constraint "buyer_business_profiles_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."buyer_business_profiles" validate constraint "buyer_business_profiles_buyer_id_fkey";

alter table "public"."products" add constraint "products_gst_rate_bps_check" CHECK (((gst_rate_bps IS NULL) OR (gst_rate_bps = ANY (ARRAY[0, 500, 1200, 1800, 2800])))) not valid;

alter table "public"."products" validate constraint "products_gst_rate_bps_check";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_valid_gstin(p_gstin text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT coalesce(
    p_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$',
    false
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_valid_hsn(p_hsn text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT coalesce(p_hsn ~ '^[0-9]{4,8}$', false);
$function$
;

CREATE OR REPLACE FUNCTION public.is_valid_pan(p_pan text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT coalesce(p_pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$', false);
$function$
;

grant delete on table "public"."buyer_business_profiles" to "anon";

grant insert on table "public"."buyer_business_profiles" to "anon";

grant references on table "public"."buyer_business_profiles" to "anon";

grant select on table "public"."buyer_business_profiles" to "anon";

grant trigger on table "public"."buyer_business_profiles" to "anon";

grant truncate on table "public"."buyer_business_profiles" to "anon";

grant update on table "public"."buyer_business_profiles" to "anon";

grant delete on table "public"."buyer_business_profiles" to "authenticated";

grant insert on table "public"."buyer_business_profiles" to "authenticated";

grant references on table "public"."buyer_business_profiles" to "authenticated";

grant select on table "public"."buyer_business_profiles" to "authenticated";

grant trigger on table "public"."buyer_business_profiles" to "authenticated";

grant truncate on table "public"."buyer_business_profiles" to "authenticated";

grant update on table "public"."buyer_business_profiles" to "authenticated";

grant delete on table "public"."buyer_business_profiles" to "service_role";

grant insert on table "public"."buyer_business_profiles" to "service_role";

grant references on table "public"."buyer_business_profiles" to "service_role";

grant select on table "public"."buyer_business_profiles" to "service_role";

grant trigger on table "public"."buyer_business_profiles" to "service_role";

grant truncate on table "public"."buyer_business_profiles" to "service_role";

grant update on table "public"."buyer_business_profiles" to "service_role";


  create policy "buyer_business_profiles_delete_own"
  on "public"."buyer_business_profiles"
  as permissive
  for delete
  to authenticated
using ((buyer_id = auth.uid()));



  create policy "buyer_business_profiles_insert_own"
  on "public"."buyer_business_profiles"
  as permissive
  for insert
  to authenticated
with check ((buyer_id = auth.uid()));



  create policy "buyer_business_profiles_select_own"
  on "public"."buyer_business_profiles"
  as permissive
  for select
  to authenticated
using (((buyer_id = auth.uid()) OR public.is_active_staff()));



  create policy "buyer_business_profiles_update_own"
  on "public"."buyer_business_profiles"
  as permissive
  for update
  to authenticated
using ((buyer_id = auth.uid()))
with check ((buyer_id = auth.uid()));


CREATE TRIGGER set_buyer_business_profiles_updated_at BEFORE UPDATE ON public.buyer_business_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


