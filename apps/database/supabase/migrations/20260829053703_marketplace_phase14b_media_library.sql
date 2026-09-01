alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."supplier_certificates" alter column "status" drop default;

alter table "public"."supplier_gallery" alter column "status" drop default;

alter type "public"."media_review_status" rename to "media_review_status__old_version_to_be_dropped";

create type "public"."media_review_status" as enum ('pending', 'approved', 'rejected', 'flagged', 'archived');


  create table "public"."product_media" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "product_id" uuid not null,
    "asset_id" uuid not null,
    "sort_order" integer not null default 0
      );


alter table "public"."product_media" enable row level security;


  create table "public"."supplier_media_assets" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid not null,
    "folder_id" uuid,
    "content_kind" text not null,
    "storage_path" text not null,
    "public_url" text not null,
    "thumbnail_url" text,
    "caption" text,
    "file_size_bytes" bigint,
    "status" public.media_review_status not null default 'approved'::public.media_review_status,
    "staff_note" text,
    "uploaded_by" uuid,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."supplier_media_assets" enable row level security;


  create table "public"."supplier_media_folders" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid not null,
    "parent_id" uuid,
    "name" text not null,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."supplier_media_folders" enable row level security;

drop policy if exists "supplier_certificates_select_public" on "public"."supplier_certificates";

drop policy if exists "supplier_gallery_select_public" on "public"."supplier_gallery";

alter table "public"."supplier_certificates" alter column status type "public"."media_review_status" using status::text::"public"."media_review_status";

alter table "public"."supplier_gallery" alter column status type "public"."media_review_status" using status::text::"public"."media_review_status";

alter table "public"."supplier_certificates" alter column "status" set default 'pending'::public.media_review_status;

alter table "public"."supplier_gallery" alter column "status" set default 'pending'::public.media_review_status;

create policy "supplier_certificates_select_public"
  on "public"."supplier_certificates"
  as permissive
  for select
  to public
using ((status = 'approved'::public.media_review_status));

create policy "supplier_gallery_select_public"
  on "public"."supplier_gallery"
  as permissive
  for select
  to public
using ((status = 'approved'::public.media_review_status));

drop type "public"."media_review_status__old_version_to_be_dropped";

alter table "public"."supplier_gallery" add column "asset_id" uuid;

alter table "public"."supplier_gallery" add column "staff_note" text;

CREATE UNIQUE INDEX product_media_pkey ON public.product_media USING btree (id);

CREATE UNIQUE INDEX product_media_product_id_asset_id_key ON public.product_media USING btree (product_id, asset_id);

CREATE INDEX product_media_product_idx ON public.product_media USING btree (product_id, sort_order);

CREATE UNIQUE INDEX supplier_media_assets_pkey ON public.supplier_media_assets USING btree (id);

CREATE INDEX supplier_media_assets_supplier_idx ON public.supplier_media_assets USING btree (supplier_id, folder_id, status);

CREATE UNIQUE INDEX supplier_media_folders_pkey ON public.supplier_media_folders USING btree (id);

CREATE INDEX supplier_media_folders_supplier_idx ON public.supplier_media_folders USING btree (supplier_id, parent_id, sort_order);

alter table "public"."product_media" add constraint "product_media_pkey" PRIMARY KEY using index "product_media_pkey";

alter table "public"."supplier_media_assets" add constraint "supplier_media_assets_pkey" PRIMARY KEY using index "supplier_media_assets_pkey";

alter table "public"."supplier_media_folders" add constraint "supplier_media_folders_pkey" PRIMARY KEY using index "supplier_media_folders_pkey";

alter table "public"."product_media" add constraint "product_media_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES public.supplier_media_assets(id) ON DELETE CASCADE not valid;

alter table "public"."product_media" validate constraint "product_media_asset_id_fkey";

alter table "public"."product_media" add constraint "product_media_product_id_asset_id_key" UNIQUE using index "product_media_product_id_asset_id_key";

alter table "public"."product_media" add constraint "product_media_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_media" validate constraint "product_media_product_id_fkey";

alter table "public"."supplier_gallery" add constraint "supplier_gallery_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES public.supplier_media_assets(id) ON DELETE SET NULL not valid;

alter table "public"."supplier_gallery" validate constraint "supplier_gallery_asset_id_fkey";

alter table "public"."supplier_media_assets" add constraint "supplier_media_assets_content_kind_check" CHECK ((content_kind = ANY (ARRAY['image'::text, 'video'::text]))) not valid;

alter table "public"."supplier_media_assets" validate constraint "supplier_media_assets_content_kind_check";

alter table "public"."supplier_media_assets" add constraint "supplier_media_assets_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES public.supplier_media_folders(id) ON DELETE SET NULL not valid;

alter table "public"."supplier_media_assets" validate constraint "supplier_media_assets_folder_id_fkey";

alter table "public"."supplier_media_assets" add constraint "supplier_media_assets_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."supplier_media_assets" validate constraint "supplier_media_assets_reviewed_by_fkey";

alter table "public"."supplier_media_assets" add constraint "supplier_media_assets_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_media_assets" validate constraint "supplier_media_assets_supplier_id_fkey";

alter table "public"."supplier_media_assets" add constraint "supplier_media_assets_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."supplier_media_assets" validate constraint "supplier_media_assets_uploaded_by_fkey";

alter table "public"."supplier_media_folders" add constraint "supplier_media_folders_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.supplier_media_folders(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_media_folders" validate constraint "supplier_media_folders_parent_id_fkey";

alter table "public"."supplier_media_folders" add constraint "supplier_media_folders_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_media_folders" validate constraint "supplier_media_folders_supplier_id_fkey";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.seed_supplier_media_folders()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.supplier_media_folders (supplier_id, name, sort_order)
  VALUES
    (NEW.id, 'Product photos', 0),
    (NEW.id, 'Product videos', 1),
    (NEW.id, 'Factory tours', 2);
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."product_media" to "anon";

grant insert on table "public"."product_media" to "anon";

grant references on table "public"."product_media" to "anon";

grant select on table "public"."product_media" to "anon";

grant trigger on table "public"."product_media" to "anon";

grant truncate on table "public"."product_media" to "anon";

grant update on table "public"."product_media" to "anon";

grant delete on table "public"."product_media" to "authenticated";

grant insert on table "public"."product_media" to "authenticated";

grant references on table "public"."product_media" to "authenticated";

grant select on table "public"."product_media" to "authenticated";

grant trigger on table "public"."product_media" to "authenticated";

grant truncate on table "public"."product_media" to "authenticated";

grant update on table "public"."product_media" to "authenticated";

grant delete on table "public"."product_media" to "service_role";

grant insert on table "public"."product_media" to "service_role";

grant references on table "public"."product_media" to "service_role";

grant select on table "public"."product_media" to "service_role";

grant trigger on table "public"."product_media" to "service_role";

grant truncate on table "public"."product_media" to "service_role";

grant update on table "public"."product_media" to "service_role";

grant delete on table "public"."supplier_media_assets" to "anon";

grant insert on table "public"."supplier_media_assets" to "anon";

grant references on table "public"."supplier_media_assets" to "anon";

grant select on table "public"."supplier_media_assets" to "anon";

grant trigger on table "public"."supplier_media_assets" to "anon";

grant truncate on table "public"."supplier_media_assets" to "anon";

grant update on table "public"."supplier_media_assets" to "anon";

grant delete on table "public"."supplier_media_assets" to "authenticated";

grant insert on table "public"."supplier_media_assets" to "authenticated";

grant references on table "public"."supplier_media_assets" to "authenticated";

grant select on table "public"."supplier_media_assets" to "authenticated";

grant trigger on table "public"."supplier_media_assets" to "authenticated";

grant truncate on table "public"."supplier_media_assets" to "authenticated";

grant update on table "public"."supplier_media_assets" to "authenticated";

grant delete on table "public"."supplier_media_assets" to "service_role";

grant insert on table "public"."supplier_media_assets" to "service_role";

grant references on table "public"."supplier_media_assets" to "service_role";

grant select on table "public"."supplier_media_assets" to "service_role";

grant trigger on table "public"."supplier_media_assets" to "service_role";

grant truncate on table "public"."supplier_media_assets" to "service_role";

grant update on table "public"."supplier_media_assets" to "service_role";

grant delete on table "public"."supplier_media_folders" to "anon";

grant insert on table "public"."supplier_media_folders" to "anon";

grant references on table "public"."supplier_media_folders" to "anon";

grant select on table "public"."supplier_media_folders" to "anon";

grant trigger on table "public"."supplier_media_folders" to "anon";

grant truncate on table "public"."supplier_media_folders" to "anon";

grant update on table "public"."supplier_media_folders" to "anon";

grant delete on table "public"."supplier_media_folders" to "authenticated";

grant insert on table "public"."supplier_media_folders" to "authenticated";

grant references on table "public"."supplier_media_folders" to "authenticated";

grant select on table "public"."supplier_media_folders" to "authenticated";

grant trigger on table "public"."supplier_media_folders" to "authenticated";

grant truncate on table "public"."supplier_media_folders" to "authenticated";

grant update on table "public"."supplier_media_folders" to "authenticated";

grant delete on table "public"."supplier_media_folders" to "service_role";

grant insert on table "public"."supplier_media_folders" to "service_role";

grant references on table "public"."supplier_media_folders" to "service_role";

grant select on table "public"."supplier_media_folders" to "service_role";

grant trigger on table "public"."supplier_media_folders" to "service_role";

grant truncate on table "public"."supplier_media_folders" to "service_role";

grant update on table "public"."supplier_media_folders" to "service_role";


  create policy "product_media_select_public"
  on "public"."product_media"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.supplier_media_assets a ON ((a.id = product_media.asset_id)))
  WHERE ((p.id = product_media.product_id) AND (p.status = 'published'::public.listing_status) AND (a.status = 'approved'::public.media_review_status)))));



  create policy "product_media_seller"
  on "public"."product_media"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.suppliers s ON ((s.id = p.supplier_id)))
  WHERE ((p.id = product_media.product_id) AND (s.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.suppliers s ON ((s.id = p.supplier_id)))
  WHERE ((p.id = product_media.product_id) AND (s.owner_id = auth.uid())))));



  create policy "product_media_staff"
  on "public"."product_media"
  as permissive
  for all
  to public
using (public.staff_has_min_role('manager'::public.staff_role))
with check (public.staff_has_min_role('manager'::public.staff_role));



  create policy "supplier_media_assets_select_public"
  on "public"."supplier_media_assets"
  as permissive
  for select
  to public
using ((status = 'approved'::public.media_review_status));



  create policy "supplier_media_assets_seller"
  on "public"."supplier_media_assets"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_media_assets.supplier_id) AND (s.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_media_assets.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "supplier_media_assets_staff"
  on "public"."supplier_media_assets"
  as permissive
  for all
  to public
using (public.staff_has_min_role('manager'::public.staff_role))
with check (public.staff_has_min_role('manager'::public.staff_role));



  create policy "supplier_media_folders_seller"
  on "public"."supplier_media_folders"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_media_folders.supplier_id) AND (s.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = supplier_media_folders.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "supplier_media_folders_staff"
  on "public"."supplier_media_folders"
  as permissive
  for all
  to public
using (public.staff_has_min_role('manager'::public.staff_role))
with check (public.staff_has_min_role('manager'::public.staff_role));


CREATE TRIGGER set_supplier_media_assets_updated_at BEFORE UPDATE ON public.supplier_media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_supplier_media_folders_updated_at BEFORE UPDATE ON public.supplier_media_folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER suppliers_seed_media_folders AFTER INSERT ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.seed_supplier_media_folders();


