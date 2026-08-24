create type "public"."gallery_media_type" as enum ('factory', 'showroom', 'warehouse', 'team', 'certificate');

create type "public"."media_review_status" as enum ('pending', 'approved', 'rejected');

create type "public"."staff_role" as enum ('super_admin', 'admin', 'manager', 'viewer');

create type "public"."verification_tier" as enum ('none', 'basic', 'verified', 'gold', 'assessed');

drop trigger if exists "products_search_vector_trigger" on "public"."products";

drop trigger if exists "set_profiles_updated_at" on "public"."profiles";

drop policy "inquiries_insert_buyer" on "public"."inquiries";

drop policy "products_admin_all" on "public"."products";

drop policy "products_delete_own" on "public"."products";

drop policy "products_insert_seller" on "public"."products";

drop policy "products_select_own" on "public"."products";

drop policy "products_select_published" on "public"."products";

drop policy "products_update_own" on "public"."products";

drop policy "profiles_insert_own" on "public"."profiles";

drop policy "profiles_select_own" on "public"."profiles";

drop policy "profiles_select_public_sellers" on "public"."profiles";

drop policy "profiles_update_own" on "public"."profiles";

drop policy "suppliers_admin_update" on "public"."suppliers";

drop policy "suppliers_delete_own" on "public"."suppliers";

drop policy "suppliers_insert_own" on "public"."suppliers";

drop policy "suppliers_select_public" on "public"."suppliers";

drop policy "suppliers_update_own" on "public"."suppliers";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

alter table "public"."categories" drop constraint "categories_parent_id_fkey";

alter table "public"."profiles" drop constraint "profiles_id_fkey";

alter table "public"."suppliers" drop constraint "suppliers_owner_id_fkey";

drop trigger if exists "on_auth_user_created" on "auth"."users";
drop function if exists "public"."handle_new_user"();

drop function if exists "public"."products_search_vector_update"();

drop function if exists "public"."user_owns_supplier"(supplier uuid);

alter table "public"."profiles" drop constraint "profiles_pkey";

drop index if exists "public"."products_search_vector_idx";

drop index if exists "public"."products_status_idx";

drop index if exists "public"."profiles_pkey";

drop index if exists "public"."profiles_role_idx";

drop index if exists "public"."suppliers_owner_id_idx";

drop table "public"."profiles";


  create table "public"."audit_logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "actor_id" uuid,
    "action" text not null,
    "entity_type" text not null,
    "entity_id" text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."platform_settings" (
    "id" boolean not null default true,
    "default_commission_bps" integer not null default 500,
    "min_commission_bps" integer not null default 500,
    "updated_by" uuid,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."platform_settings" enable row level security;


  create table "public"."staff_members" (
    "user_id" uuid not null,
    "role" public.staff_role not null default 'viewer'::public.staff_role,
    "department" text,
    "is_active" boolean not null default true,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "can_set_below_min_commission" boolean not null default false
      );


alter table "public"."staff_members" enable row level security;


  create table "public"."supplier_certificates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid not null,
    "name" text not null,
    "file_url" text not null,
    "expires_at" date,
    "status" public.media_review_status not null default 'pending'::public.media_review_status,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."supplier_certificates" enable row level security;


  create table "public"."supplier_gallery" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid not null,
    "media_type" public.gallery_media_type not null default 'factory'::public.gallery_media_type,
    "image_url" text not null,
    "caption" text,
    "sort_order" integer not null default 0,
    "status" public.media_review_status not null default 'pending'::public.media_review_status,
    "uploaded_by" uuid,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."supplier_gallery" enable row level security;

alter table "public"."categories" drop column "parent_id";

alter table "public"."products" drop column "attributes";

alter table "public"."products" drop column "customization_available";

alter table "public"."products" drop column "lead_time_days";

alter table "public"."products" drop column "max_order_qty";

alter table "public"."products" drop column "payment_terms";

alter table "public"."products" drop column "sample_available";

alter table "public"."products" drop column "search_vector";

alter table "public"."products" drop column "shipping_info";

alter table "public"."products" drop column "status";

alter table "public"."products" drop column "unit";

alter table "public"."products" drop column "variants";

alter table "public"."suppliers" add column "commission_below_min_approved" boolean not null default false;

alter table "public"."suppliers" add column "commission_notes" text;

alter table "public"."suppliers" add column "commission_rate_bps" integer not null default 500;

alter table "public"."suppliers" add column "commission_set_at" timestamp with time zone;

alter table "public"."suppliers" add column "commission_set_by" uuid;

alter table "public"."suppliers" add column "verification_tier" public.verification_tier not null default 'none'::public.verification_tier;

drop type "public"."listing_status";

drop type "public"."user_role";

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity_type, entity_id);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX platform_settings_pkey ON public.platform_settings USING btree (id);

CREATE UNIQUE INDEX staff_members_pkey ON public.staff_members USING btree (user_id);

CREATE INDEX staff_members_role_idx ON public.staff_members USING btree (role);

CREATE UNIQUE INDEX supplier_certificates_pkey ON public.supplier_certificates USING btree (id);

CREATE INDEX supplier_certificates_supplier_idx ON public.supplier_certificates USING btree (supplier_id, status);

CREATE UNIQUE INDEX supplier_gallery_pkey ON public.supplier_gallery USING btree (id);

CREATE INDEX supplier_gallery_supplier_idx ON public.supplier_gallery USING btree (supplier_id, status, sort_order);

CREATE INDEX suppliers_commission_rate_bps_idx ON public.suppliers USING btree (commission_rate_bps);

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."platform_settings" add constraint "platform_settings_pkey" PRIMARY KEY using index "platform_settings_pkey";

alter table "public"."staff_members" add constraint "staff_members_pkey" PRIMARY KEY using index "staff_members_pkey";

alter table "public"."supplier_certificates" add constraint "supplier_certificates_pkey" PRIMARY KEY using index "supplier_certificates_pkey";

alter table "public"."supplier_gallery" add constraint "supplier_gallery_pkey" PRIMARY KEY using index "supplier_gallery_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_actor_id_fkey";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

alter table "public"."platform_settings" add constraint "platform_settings_default_gte_min" CHECK ((default_commission_bps >= min_commission_bps)) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_default_gte_min";

alter table "public"."platform_settings" add constraint "platform_settings_id_check" CHECK ((id = true)) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_id_check";

alter table "public"."platform_settings" add constraint "platform_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_updated_by_fkey";

alter table "public"."staff_members" add constraint "staff_members_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."staff_members" validate constraint "staff_members_created_by_fkey";

alter table "public"."staff_members" add constraint "staff_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."staff_members" validate constraint "staff_members_user_id_fkey";

alter table "public"."supplier_certificates" add constraint "supplier_certificates_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_certificates" validate constraint "supplier_certificates_supplier_id_fkey";

alter table "public"."supplier_gallery" add constraint "supplier_gallery_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."supplier_gallery" validate constraint "supplier_gallery_reviewed_by_fkey";

alter table "public"."supplier_gallery" add constraint "supplier_gallery_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_gallery" validate constraint "supplier_gallery_supplier_id_fkey";

alter table "public"."supplier_gallery" add constraint "supplier_gallery_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."supplier_gallery" validate constraint "supplier_gallery_uploaded_by_fkey";

alter table "public"."suppliers" add constraint "suppliers_commission_bps_range" CHECK (((commission_rate_bps >= 0) AND (commission_rate_bps <= 10000))) not valid;

alter table "public"."suppliers" validate constraint "suppliers_commission_bps_range";

alter table "public"."suppliers" add constraint "suppliers_commission_set_by_fkey" FOREIGN KEY (commission_set_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."suppliers" validate constraint "suppliers_commission_set_by_fkey";

alter table "public"."suppliers" add constraint "suppliers_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."suppliers" validate constraint "suppliers_owner_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_active_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid() AND sm.is_active = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.staff_has_min_role(min_role public.staff_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role public.staff_role;
  role_rank int;
  min_rank int;
BEGIN
  SELECT role INTO user_role
  FROM public.staff_members
  WHERE user_id = auth.uid() AND is_active = true;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  role_rank := CASE user_role
    WHEN 'viewer' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
  END;

  min_rank := CASE min_role
    WHEN 'viewer' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
  END;

  RETURN role_rank >= min_rank;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_supplier_commission(p_rate_bps integer, p_below_min_approved boolean, p_actor_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  min_bps integer;
  actor_role public.staff_role;
  actor_can_below boolean;
BEGIN
  SELECT min_commission_bps INTO min_bps FROM public.platform_settings WHERE id = true;

  IF p_rate_bps < 0 OR p_rate_bps > 10000 THEN
    RAISE EXCEPTION 'commission_rate_bps must be between 0 and 10000';
  END IF;

  SELECT sm.role, sm.can_set_below_min_commission
  INTO actor_role, actor_can_below
  FROM public.staff_members sm
  WHERE sm.user_id = p_actor_id AND sm.is_active = true;

  IF actor_role IS NULL THEN
    RAISE EXCEPTION 'only active staff may set vendor commission';
  END IF;

  IF NOT public.staff_has_min_role('manager') THEN
    RAISE EXCEPTION 'manager role or higher required to set commission';
  END IF;

  IF p_rate_bps < min_bps THEN
    IF p_below_min_approved IS NOT TRUE THEN
      RAISE EXCEPTION 'commission below % bps requires below-minimum approval', min_bps;
    END IF;

    IF actor_role <> 'super_admin' AND actor_can_below IS NOT TRUE THEN
      RAISE EXCEPTION 'only super_admin or delegated staff may approve below-minimum commission';
    END IF;
  END IF;

  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_private_item_owner_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.owner_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."platform_settings" to "anon";

grant insert on table "public"."platform_settings" to "anon";

grant references on table "public"."platform_settings" to "anon";

grant select on table "public"."platform_settings" to "anon";

grant trigger on table "public"."platform_settings" to "anon";

grant truncate on table "public"."platform_settings" to "anon";

grant update on table "public"."platform_settings" to "anon";

grant delete on table "public"."platform_settings" to "authenticated";

grant insert on table "public"."platform_settings" to "authenticated";

grant references on table "public"."platform_settings" to "authenticated";

grant select on table "public"."platform_settings" to "authenticated";

grant trigger on table "public"."platform_settings" to "authenticated";

grant truncate on table "public"."platform_settings" to "authenticated";

grant update on table "public"."platform_settings" to "authenticated";

grant delete on table "public"."platform_settings" to "service_role";

grant insert on table "public"."platform_settings" to "service_role";

grant references on table "public"."platform_settings" to "service_role";

grant select on table "public"."platform_settings" to "service_role";

grant trigger on table "public"."platform_settings" to "service_role";

grant truncate on table "public"."platform_settings" to "service_role";

grant update on table "public"."platform_settings" to "service_role";

grant delete on table "public"."staff_members" to "anon";

grant insert on table "public"."staff_members" to "anon";

grant references on table "public"."staff_members" to "anon";

grant select on table "public"."staff_members" to "anon";

grant trigger on table "public"."staff_members" to "anon";

grant truncate on table "public"."staff_members" to "anon";

grant update on table "public"."staff_members" to "anon";

grant delete on table "public"."staff_members" to "authenticated";

grant insert on table "public"."staff_members" to "authenticated";

grant references on table "public"."staff_members" to "authenticated";

grant select on table "public"."staff_members" to "authenticated";

grant trigger on table "public"."staff_members" to "authenticated";

grant truncate on table "public"."staff_members" to "authenticated";

grant update on table "public"."staff_members" to "authenticated";

grant delete on table "public"."staff_members" to "service_role";

grant insert on table "public"."staff_members" to "service_role";

grant references on table "public"."staff_members" to "service_role";

grant select on table "public"."staff_members" to "service_role";

grant trigger on table "public"."staff_members" to "service_role";

grant truncate on table "public"."staff_members" to "service_role";

grant update on table "public"."staff_members" to "service_role";

grant delete on table "public"."supplier_certificates" to "anon";

grant insert on table "public"."supplier_certificates" to "anon";

grant references on table "public"."supplier_certificates" to "anon";

grant select on table "public"."supplier_certificates" to "anon";

grant trigger on table "public"."supplier_certificates" to "anon";

grant truncate on table "public"."supplier_certificates" to "anon";

grant update on table "public"."supplier_certificates" to "anon";

grant delete on table "public"."supplier_certificates" to "authenticated";

grant insert on table "public"."supplier_certificates" to "authenticated";

grant references on table "public"."supplier_certificates" to "authenticated";

grant select on table "public"."supplier_certificates" to "authenticated";

grant trigger on table "public"."supplier_certificates" to "authenticated";

grant truncate on table "public"."supplier_certificates" to "authenticated";

grant update on table "public"."supplier_certificates" to "authenticated";

grant delete on table "public"."supplier_certificates" to "service_role";

grant insert on table "public"."supplier_certificates" to "service_role";

grant references on table "public"."supplier_certificates" to "service_role";

grant select on table "public"."supplier_certificates" to "service_role";

grant trigger on table "public"."supplier_certificates" to "service_role";

grant truncate on table "public"."supplier_certificates" to "service_role";

grant update on table "public"."supplier_certificates" to "service_role";

grant delete on table "public"."supplier_gallery" to "anon";

grant insert on table "public"."supplier_gallery" to "anon";

grant references on table "public"."supplier_gallery" to "anon";

grant select on table "public"."supplier_gallery" to "anon";

grant trigger on table "public"."supplier_gallery" to "anon";

grant truncate on table "public"."supplier_gallery" to "anon";

grant update on table "public"."supplier_gallery" to "anon";

grant delete on table "public"."supplier_gallery" to "authenticated";

grant insert on table "public"."supplier_gallery" to "authenticated";

grant references on table "public"."supplier_gallery" to "authenticated";

grant select on table "public"."supplier_gallery" to "authenticated";

grant trigger on table "public"."supplier_gallery" to "authenticated";

grant truncate on table "public"."supplier_gallery" to "authenticated";

grant update on table "public"."supplier_gallery" to "authenticated";

grant delete on table "public"."supplier_gallery" to "service_role";

grant insert on table "public"."supplier_gallery" to "service_role";

grant references on table "public"."supplier_gallery" to "service_role";

grant select on table "public"."supplier_gallery" to "service_role";

grant trigger on table "public"."supplier_gallery" to "service_role";

grant truncate on table "public"."supplier_gallery" to "service_role";

grant update on table "public"."supplier_gallery" to "service_role";


  create policy "audit_logs_insert_staff"
  on "public"."audit_logs"
  as permissive
  for insert
  to public
with check ((public.staff_has_min_role('manager'::public.staff_role) AND (actor_id = auth.uid())));



  create policy "audit_logs_select_staff"
  on "public"."audit_logs"
  as permissive
  for select
  to public
using (public.is_active_staff());



  create policy "inquiries_insert_auth"
  on "public"."inquiries"
  as permissive
  for insert
  to public
with check ((auth.uid() IS NOT NULL));



  create policy "platform_settings_select_staff"
  on "public"."platform_settings"
  as permissive
  for select
  to public
using (public.is_active_staff());



  create policy "platform_settings_update_super_admin"
  on "public"."platform_settings"
  as permissive
  for update
  to public
using (public.staff_has_min_role('super_admin'::public.staff_role))
with check (public.staff_has_min_role('super_admin'::public.staff_role));



  create policy "staff_members_insert_admin"
  on "public"."staff_members"
  as permissive
  for insert
  to public
with check (public.staff_has_min_role('admin'::public.staff_role));



  create policy "staff_members_select_own"
  on "public"."staff_members"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR public.staff_has_min_role('admin'::public.staff_role)));



  create policy "staff_members_update_admin"
  on "public"."staff_members"
  as permissive
  for update
  to public
using (public.staff_has_min_role('admin'::public.staff_role))
with check (public.staff_has_min_role('admin'::public.staff_role));



  create policy "supplier_certificates_insert_seller"
  on "public"."supplier_certificates"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_certificates.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "supplier_certificates_select_own"
  on "public"."supplier_certificates"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_certificates.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "supplier_certificates_select_public"
  on "public"."supplier_certificates"
  as permissive
  for select
  to public
using ((status = 'approved'::public.media_review_status));



  create policy "supplier_certificates_staff_all"
  on "public"."supplier_certificates"
  as permissive
  for all
  to public
using (public.staff_has_min_role('manager'::public.staff_role))
with check (public.staff_has_min_role('manager'::public.staff_role));



  create policy "supplier_gallery_insert_seller"
  on "public"."supplier_gallery"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_gallery.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "supplier_gallery_select_own"
  on "public"."supplier_gallery"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_gallery.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "supplier_gallery_select_public"
  on "public"."supplier_gallery"
  as permissive
  for select
  to public
using ((status = 'approved'::public.media_review_status));



  create policy "supplier_gallery_staff_all"
  on "public"."supplier_gallery"
  as permissive
  for all
  to public
using (public.staff_has_min_role('manager'::public.staff_role))
with check (public.staff_has_min_role('manager'::public.staff_role));



  create policy "suppliers_select_all"
  on "public"."suppliers"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER set_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_staff_members_updated_at BEFORE UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_supplier_certificates_updated_at BEFORE UPDATE ON public.supplier_certificates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_supplier_gallery_updated_at BEFORE UPDATE ON public.supplier_gallery FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



drop policy "product_images_insert" on "storage"."objects";

drop policy "product_images_select" on "storage"."objects";

drop policy "product_images_update" on "storage"."objects";


  create policy "supplier_media_delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'supplier-media'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "supplier_media_insert"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'supplier-media'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "supplier_media_select"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'supplier-media'::text));



  create policy "supplier_media_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'supplier-media'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



