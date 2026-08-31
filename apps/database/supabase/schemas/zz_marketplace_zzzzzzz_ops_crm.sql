-- Ops CRM: staff can read all profiles; manager+ can update any supplier (help desk edits)

DROP POLICY IF EXISTS profiles_select_staff ON public.profiles;
CREATE POLICY profiles_select_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_active_staff());

DROP POLICY IF EXISTS suppliers_staff_update ON public.suppliers;
CREATE POLICY suppliers_staff_update ON public.suppliers
  FOR UPDATE TO authenticated
  USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));

DROP POLICY IF EXISTS suppliers_staff_select ON public.suppliers;
CREATE POLICY suppliers_staff_select ON public.suppliers
  FOR SELECT TO authenticated
  USING (public.is_active_staff());

DROP POLICY IF EXISTS inquiries_select_staff ON public.inquiries;
CREATE POLICY inquiries_select_staff ON public.inquiries
  FOR SELECT TO authenticated
  USING (public.is_active_staff());
