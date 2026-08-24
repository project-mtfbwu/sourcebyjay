-- SourceByJay Phase 1: trust tiers, supplier gallery, certificates
-- Generate migration: cd apps/database && supabase db diff -f marketplace_trust_media

CREATE TYPE public.verification_tier AS ENUM (
  'none',
  'basic',
  'verified',
  'gold',
  'assessed'
);

CREATE TYPE public.gallery_media_type AS ENUM (
  'factory',
  'showroom',
  'warehouse',
  'team',
  'certificate'
);

CREATE TYPE public.media_review_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS verification_tier public.verification_tier NOT NULL DEFAULT 'none';

-- Backfill legacy verified flag
UPDATE public.suppliers
SET verification_tier = 'verified'
WHERE verified = true AND verification_tier = 'none';

CREATE TABLE IF NOT EXISTS public.supplier_gallery (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  media_type public.gallery_media_type NOT NULL DEFAULT 'factory',
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.media_review_status NOT NULL DEFAULT 'pending',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_certificates (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  expires_at date,
  status public.media_review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS supplier_gallery_supplier_idx
  ON public.supplier_gallery(supplier_id, status, sort_order);

CREATE INDEX IF NOT EXISTS supplier_certificates_supplier_idx
  ON public.supplier_certificates(supplier_id, status);

ALTER TABLE public.supplier_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_certificates ENABLE ROW LEVEL SECURITY;

-- Public: approved gallery + certificates only
CREATE POLICY supplier_gallery_select_public ON public.supplier_gallery
  FOR SELECT USING (status = 'approved');

CREATE POLICY supplier_certificates_select_public ON public.supplier_certificates
  FOR SELECT USING (status = 'approved');

-- Seller: manage own supplier gallery (via owner_id on suppliers)
CREATE POLICY supplier_gallery_insert_seller ON public.supplier_gallery
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY supplier_gallery_select_own ON public.supplier_gallery
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY supplier_certificates_insert_seller ON public.supplier_certificates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY supplier_certificates_select_own ON public.supplier_certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

-- Ops staff: review all gallery + certificates
CREATE POLICY supplier_gallery_staff_all ON public.supplier_gallery
  FOR ALL USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));

CREATE POLICY supplier_certificates_staff_all ON public.supplier_certificates
  FOR ALL USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));

CREATE TRIGGER set_supplier_gallery_updated_at
  BEFORE UPDATE ON public.supplier_gallery
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_supplier_certificates_updated_at
  BEFORE UPDATE ON public.supplier_certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for supplier factory/godown photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'supplier-media',
  'supplier-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY supplier_media_select ON storage.objects
  FOR SELECT USING (bucket_id = 'supplier-media');

CREATE POLICY supplier_media_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'supplier-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY supplier_media_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'supplier-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY supplier_media_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'supplier-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
