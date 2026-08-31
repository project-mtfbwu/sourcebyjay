-- Phase 14B: seller media library, product multi-media, ops flag/archive

ALTER TYPE public.media_review_status ADD VALUE IF NOT EXISTS 'flagged';
ALTER TYPE public.media_review_status ADD VALUE IF NOT EXISTS 'archived';

ALTER TABLE public.supplier_gallery
  ADD COLUMN IF NOT EXISTS staff_note text;

ALTER TABLE public.supplier_gallery
  ADD COLUMN IF NOT EXISTS asset_id uuid;

CREATE TABLE IF NOT EXISTS public.supplier_media_folders (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.supplier_media_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS supplier_media_folders_supplier_idx
  ON public.supplier_media_folders(supplier_id, parent_id, sort_order);

-- One root folder name per supplier (prevents duplicate seed races)
CREATE UNIQUE INDEX IF NOT EXISTS supplier_media_folders_supplier_name_uidx
  ON public.supplier_media_folders (supplier_id, name)
  WHERE parent_id IS NULL;

CREATE TABLE IF NOT EXISTS public.supplier_media_assets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.supplier_media_folders(id) ON DELETE SET NULL,
  content_kind text NOT NULL CHECK (content_kind IN ('image', 'video')),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  thumbnail_url text,
  caption text,
  file_size_bytes bigint,
  status public.media_review_status NOT NULL DEFAULT 'approved',
  staff_note text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS supplier_media_assets_supplier_idx
  ON public.supplier_media_assets(supplier_id, folder_id, status);

CREATE TABLE IF NOT EXISTS public.product_media (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.supplier_media_assets(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, asset_id)
);

CREATE INDEX IF NOT EXISTS product_media_product_idx
  ON public.product_media(product_id, sort_order);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_gallery_asset_id_fkey'
  ) THEN
    ALTER TABLE public.supplier_gallery
      ADD CONSTRAINT supplier_gallery_asset_id_fkey
      FOREIGN KEY (asset_id) REFERENCES public.supplier_media_assets(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.supplier_media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

-- Folders: seller owns supplier
DROP POLICY IF EXISTS supplier_media_folders_seller ON public.supplier_media_folders;
CREATE POLICY supplier_media_folders_seller ON public.supplier_media_folders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS supplier_media_folders_staff ON public.supplier_media_folders;
CREATE POLICY supplier_media_folders_staff ON public.supplier_media_folders
  FOR ALL USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));

-- Assets: public read approved only; seller CRUD own; staff all
DROP POLICY IF EXISTS supplier_media_assets_select_public ON public.supplier_media_assets;
CREATE POLICY supplier_media_assets_select_public ON public.supplier_media_assets
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS supplier_media_assets_seller ON public.supplier_media_assets;
CREATE POLICY supplier_media_assets_seller ON public.supplier_media_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS supplier_media_assets_staff ON public.supplier_media_assets;
CREATE POLICY supplier_media_assets_staff ON public.supplier_media_assets
  FOR ALL USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));

-- Product media: public via published products + approved assets
DROP POLICY IF EXISTS product_media_select_public ON public.product_media;
CREATE POLICY product_media_select_public ON public.product_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.supplier_media_assets a ON a.id = asset_id
      WHERE p.id = product_id
        AND p.status = 'published'
        AND a.status = 'approved'
    )
  );

DROP POLICY IF EXISTS product_media_seller ON public.product_media;
CREATE POLICY product_media_seller ON public.product_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.suppliers s ON s.id = p.supplier_id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.suppliers s ON s.id = p.supplier_id
      WHERE p.id = product_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS product_media_staff ON public.product_media;
CREATE POLICY product_media_staff ON public.product_media
  FOR ALL USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));

CREATE TRIGGER set_supplier_media_folders_updated_at
  BEFORE UPDATE ON public.supplier_media_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_supplier_media_assets_updated_at
  BEFORE UPDATE ON public.supplier_media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Default library folders for new suppliers
CREATE OR REPLACE FUNCTION public.seed_supplier_media_folders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.supplier_media_folders (supplier_id, name, sort_order)
  VALUES
    (NEW.id, 'Product photos', 0),
    (NEW.id, 'Product videos', 1),
    (NEW.id, 'Factory tours', 2)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS suppliers_seed_media_folders ON public.suppliers;
CREATE TRIGGER suppliers_seed_media_folders
  AFTER INSERT ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.seed_supplier_media_folders();
