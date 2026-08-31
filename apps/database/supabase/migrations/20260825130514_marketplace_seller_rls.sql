alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  account_type text;
  new_role public.user_role;
BEGIN
  account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer');
  IF account_type = 'seller' THEN
    new_role := 'seller';
  ELSE
    new_role := 'buyer';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    phone,
    company_name,
    country,
    city,
    gstin
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    new_role,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'gstin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;


  create policy "suppliers_delete_own"
  on "public"."suppliers"
  as permissive
  for delete
  to authenticated
using ((owner_id = auth.uid()));



  create policy "suppliers_insert_own"
  on "public"."suppliers"
  as permissive
  for insert
  to authenticated
with check ((owner_id = auth.uid()));



  create policy "suppliers_update_own"
  on "public"."suppliers"
  as permissive
  for update
  to authenticated
using ((owner_id = auth.uid()))
with check ((owner_id = auth.uid()));



