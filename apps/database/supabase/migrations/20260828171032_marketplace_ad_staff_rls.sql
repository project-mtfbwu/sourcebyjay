drop policy "ad_campaigns_vendor_all" on "public"."ad_campaigns";

drop policy "ad_creatives_via_campaign" on "public"."ad_creatives";

drop policy "ad_keywords_via_campaign" on "public"."ad_keywords";

  create policy "ad_campaigns_delete"
  on "public"."ad_campaigns"
  as permissive
  for delete
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_campaigns.supplier_id) AND (s.owner_id = auth.uid())))) OR public.staff_has_min_role('manager'::public.staff_role)));



  create policy "ad_campaigns_mutate"
  on "public"."ad_campaigns"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_campaigns.supplier_id) AND (s.owner_id = auth.uid())))) OR public.staff_has_min_role('manager'::public.staff_role)));



  create policy "ad_campaigns_select"
  on "public"."ad_campaigns"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_campaigns.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()));



  create policy "ad_campaigns_update"
  on "public"."ad_campaigns"
  as permissive
  for update
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_campaigns.supplier_id) AND (s.owner_id = auth.uid())))) OR public.staff_has_min_role('manager'::public.staff_role)))
with check (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_campaigns.supplier_id) AND (s.owner_id = auth.uid())))) OR public.staff_has_min_role('manager'::public.staff_role)));



  create policy "ad_creatives_delete"
  on "public"."ad_creatives"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_creatives.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



  create policy "ad_creatives_mutate"
  on "public"."ad_creatives"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_creatives.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



  create policy "ad_creatives_select"
  on "public"."ad_creatives"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_creatives.campaign_id) AND ((s.owner_id = auth.uid()) OR public.is_active_staff())))));



  create policy "ad_creatives_update"
  on "public"."ad_creatives"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_creatives.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



  create policy "ad_keywords_delete"
  on "public"."ad_keywords"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_keywords.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



  create policy "ad_keywords_mutate"
  on "public"."ad_keywords"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_keywords.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



  create policy "ad_keywords_select"
  on "public"."ad_keywords"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_keywords.campaign_id) AND ((s.owner_id = auth.uid()) OR public.is_active_staff())))));



  create policy "ad_keywords_update"
  on "public"."ad_keywords"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_keywords.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



