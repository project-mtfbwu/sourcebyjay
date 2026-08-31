-- Phase 18B: Storefront versions (draft → ops review → publish)

CREATE TABLE IF NOT EXISTS public.supplier_storefront_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  version_label text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published', 'superseded')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, version_number)
);

CREATE INDEX IF NOT EXISTS supplier_storefront_versions_supplier_status_idx
  ON public.supplier_storefront_versions (supplier_id, status, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS supplier_storefront_versions_one_pending_idx
  ON public.supplier_storefront_versions (supplier_id)
  WHERE status = 'pending_review';

CREATE OR REPLACE FUNCTION public.next_storefront_version_number(p_supplier_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT coalesce(max(version_number), 0) + 1
  FROM public.supplier_storefront_versions
  WHERE supplier_id = p_supplier_id;
$$;

GRANT EXECUTE ON FUNCTION public.next_storefront_version_number(uuid) TO authenticated;

ALTER TABLE public.supplier_storefront_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_storefront_versions_owner ON public.supplier_storefront_versions;
CREATE POLICY supplier_storefront_versions_owner ON public.supplier_storefront_versions
  FOR ALL TO authenticated
  USING (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_storefront_versions.supplier_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_active_staff()
    OR (
      EXISTS (
        SELECT 1 FROM public.suppliers s
        WHERE s.id = supplier_storefront_versions.supplier_id
          AND s.owner_id = auth.uid()
      )
      AND status IN ('draft', 'pending_review')
    )
  );

DROP POLICY IF EXISTS supplier_storefront_versions_staff_review ON public.supplier_storefront_versions;
CREATE POLICY supplier_storefront_versions_staff_review ON public.supplier_storefront_versions
  FOR UPDATE TO authenticated
  USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));
