-- Restore products RLS (dropped in trust_media migration, never re-declared in schemas).
-- Sellers need select/insert/update/delete on own listings; buyers see published only.

DROP POLICY IF EXISTS products_select_published ON public.products;
CREATE POLICY products_select_published ON public.products
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS products_select_own ON public.products;
CREATE POLICY products_select_own ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = products.supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS products_insert_seller ON public.products;
CREATE POLICY products_insert_seller ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS products_update_own ON public.products;
CREATE POLICY products_update_own ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = products.supplier_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS products_delete_own ON public.products;
CREATE POLICY products_delete_own ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = products.supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS products_staff_all ON public.products;
CREATE POLICY products_staff_all ON public.products
  FOR ALL USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());
