  create policy "products_delete_own"
  on "public"."products"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = products.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "products_insert_seller"
  on "public"."products"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = products.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "products_select_own"
  on "public"."products"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = products.supplier_id) AND (s.owner_id = auth.uid())))));



  create policy "products_select_published"
  on "public"."products"
  as permissive
  for select
  to public
using ((status = 'published'::public.listing_status));



  create policy "products_staff_all"
  on "public"."products"
  as permissive
  for all
  to public
using (public.is_active_staff())
with check (public.is_active_staff());



  create policy "products_update_own"
  on "public"."products"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = products.supplier_id) AND (s.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = products.supplier_id) AND (s.owner_id = auth.uid())))));
