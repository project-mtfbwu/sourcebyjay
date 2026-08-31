create type "public"."listing_status" as enum ('draft', 'published', 'archived');

create type "public"."user_role" as enum ('buyer', 'seller', 'admin');

alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "role" public.user_role not null default 'buyer'::public.user_role,
    "company_name" text,
    "phone" text,
    "country" text,
    "city" text,
    "bio" text,
    "gstin" text,
    "industry" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;

alter table "public"."products" add column "attributes" jsonb not null default '[]'::jsonb;

alter table "public"."products" add column "customization_available" boolean not null default false;

alter table "public"."products" add column "lead_time_days" integer;

alter table "public"."products" add column "max_order_qty" integer;

alter table "public"."products" add column "payment_terms" text;

alter table "public"."products" add column "sample_available" boolean not null default false;

alter table "public"."products" add column "shipping_info" jsonb not null default '{}'::jsonb;

alter table "public"."products" add column "status" public.listing_status not null default 'draft'::public.listing_status;

alter table "public"."products" add column "unit" text not null default 'piece'::text;

alter table "public"."products" add column "variants" jsonb not null default '[]'::jsonb;

CREATE INDEX products_status_idx ON public.products USING btree (status);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX profiles_role_idx ON public.profiles USING btree (role);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "profiles_insert_own"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "profiles_select_public_sellers"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((role = ANY (ARRAY['seller'::public.user_role, 'admin'::public.user_role])) AND (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.owner_id = profiles.id) AND (s.verified = true))))));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


