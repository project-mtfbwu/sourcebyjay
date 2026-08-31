create policy "inquiries_select_staff"
  on "public"."inquiries"
  as permissive
  for select
  to authenticated
using (public.is_active_staff());
