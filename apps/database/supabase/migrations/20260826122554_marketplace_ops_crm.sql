alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";


  create policy "profiles_select_staff"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (public.is_active_staff());



  create policy "suppliers_staff_select"
  on "public"."suppliers"
  as permissive
  for select
  to authenticated
using (public.is_active_staff());



  create policy "suppliers_staff_update"
  on "public"."suppliers"
  as permissive
  for update
  to authenticated
using (public.staff_has_min_role('manager'::public.staff_role))
with check (public.staff_has_min_role('manager'::public.staff_role));



