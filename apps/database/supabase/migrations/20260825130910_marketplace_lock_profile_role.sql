alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Profile role cannot be changed. Buyer and seller accounts are separate.';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER profiles_lock_role BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();


