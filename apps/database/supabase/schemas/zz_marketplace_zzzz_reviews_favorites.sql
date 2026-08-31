-- Phase 6: favorites, verified reviews, request listing (Alibaba parallels)

-- ---------------------------------------------------------------------------
-- Favorites (product and/or supplier — Alibaba Favorites heart)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.buyer_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('product', 'supplier')),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buyer_favorites_product_shape CHECK (
    (kind = 'product' AND product_id IS NOT NULL)
    OR (kind = 'supplier' AND product_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS buyer_favorites_product_unique
  ON public.buyer_favorites (buyer_id, product_id)
  WHERE kind = 'product';

CREATE UNIQUE INDEX IF NOT EXISTS buyer_favorites_supplier_unique
  ON public.buyer_favorites (buyer_id, supplier_id)
  WHERE kind = 'supplier';

CREATE INDEX IF NOT EXISTS buyer_favorites_buyer_idx
  ON public.buyer_favorites (buyer_id, created_at DESC);

ALTER TABLE public.buyer_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS buyer_favorites_select_own ON public.buyer_favorites;
CREATE POLICY buyer_favorites_select_own ON public.buyer_favorites
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR public.is_active_staff());

DROP POLICY IF EXISTS buyer_favorites_insert_own ON public.buyer_favorites;
CREATE POLICY buyer_favorites_insert_own ON public.buyer_favorites
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS buyer_favorites_delete_own ON public.buyer_favorites;
CREATE POLICY buyer_favorites_delete_own ON public.buyer_favorites
  FOR DELETE TO authenticated
  USING (buyer_id = auth.uid() OR public.is_active_staff());

GRANT ALL ON TABLE public.buyer_favorites TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.toggle_buyer_favorite(
  p_kind text,
  p_supplier_id uuid,
  p_product_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_kind NOT IN ('product', 'supplier') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind');
  END IF;
  IF p_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'supplier_required');
  END IF;
  IF p_kind = 'product' AND p_product_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'product_required');
  END IF;

  IF p_kind = 'product' THEN
    SELECT id INTO v_existing
    FROM public.buyer_favorites
    WHERE buyer_id = v_uid AND kind = 'product' AND product_id = p_product_id;
  ELSE
    SELECT id INTO v_existing
    FROM public.buyer_favorites
    WHERE buyer_id = v_uid AND kind = 'supplier' AND supplier_id = p_supplier_id;
  END IF;

  IF v_existing IS NOT NULL THEN
    DELETE FROM public.buyer_favorites WHERE id = v_existing;
    RETURN jsonb_build_object('ok', true, 'favorited', false);
  END IF;

  INSERT INTO public.buyer_favorites (buyer_id, kind, product_id, supplier_id)
  VALUES (
    v_uid,
    p_kind,
    CASE WHEN p_kind = 'product' THEN p_product_id ELSE NULL END,
    p_supplier_id
  );

  RETURN jsonb_build_object('ok', true, 'favorited', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_buyer_favorite(text, uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Verified reviews (one per completed order — Alibaba verified transaction)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text CHECK (title IS NULL OR char_length(trim(title)) <= 120),
  body text NOT NULL CHECK (char_length(trim(body)) >= 10 AND char_length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_one_per_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_supplier_idx ON public.reviews (supplier_id, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
CREATE POLICY reviews_select_public ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

GRANT ALL ON TABLE public.reviews TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_verified_review(
  p_order_id uuid,
  p_rating integer,
  p_body text,
  p_title text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_rating');
  END IF;
  IF p_body IS NULL OR char_length(trim(p_body)) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'body_too_short');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_found');
  END IF;
  IF v_order.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_your_order');
  END IF;
  IF v_order.status <> 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_completed');
  END IF;
  IF EXISTS (SELECT 1 FROM public.reviews WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_reviewed');
  END IF;

  INSERT INTO public.reviews (
    buyer_id, order_id, product_id, supplier_id, rating, title, body
  ) VALUES (
    v_uid,
    p_order_id,
    v_order.product_id,
    v_order.supplier_id,
    p_rating,
    NULLIF(trim(COALESCE(p_title, '')), ''),
    trim(p_body)
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'review_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_verified_review(uuid, integer, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Request listing (open notice board — Alibaba public RFQ post)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.listing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) >= 5 AND char_length(title) <= 200),
  description text NOT NULL CHECK (char_length(trim(description)) >= 20 AND char_length(description) <= 4000),
  quantity integer CHECK (quantity IS NULL OR quantity > 0),
  category_hint text CHECK (category_hint IS NULL OR char_length(category_hint) <= 120),
  contact_email text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_requests_status_idx
  ON public.listing_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS listing_requests_buyer_idx
  ON public.listing_requests (buyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.listing_request_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_request_id uuid NOT NULL REFERENCES public.listing_requests(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(trim(message)) >= 10 AND char_length(message) <= 2000),
  unit_price numeric(12, 2) CHECK (unit_price IS NULL OR unit_price >= 0),
  currency text NOT NULL DEFAULT 'INR',
  lead_time_days integer CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_request_offers_unique UNIQUE (listing_request_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS listing_request_offers_supplier_idx
  ON public.listing_request_offers (supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS listing_request_offers_request_idx
  ON public.listing_request_offers (listing_request_id, created_at DESC);

ALTER TABLE public.listing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_request_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_requests_select ON public.listing_requests;
CREATE POLICY listing_requests_select ON public.listing_requests
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS listing_requests_insert_buyer ON public.listing_requests;
CREATE POLICY listing_requests_insert_buyer ON public.listing_requests
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS listing_requests_update_buyer ON public.listing_requests;
CREATE POLICY listing_requests_update_buyer ON public.listing_requests
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR public.is_active_staff())
  WITH CHECK (buyer_id = auth.uid() OR public.is_active_staff());

DROP POLICY IF EXISTS listing_request_offers_select ON public.listing_request_offers;
CREATE POLICY listing_request_offers_select ON public.listing_request_offers
  FOR SELECT TO authenticated
  USING (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.listing_requests lr
      WHERE lr.id = listing_request_id AND lr.buyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS listing_request_offers_insert_seller ON public.listing_request_offers;
CREATE POLICY listing_request_offers_insert_seller ON public.listing_request_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

GRANT ALL ON TABLE public.listing_requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.listing_request_offers TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_listing_request(
  p_title text,
  p_description text,
  p_contact_email text,
  p_quantity integer DEFAULT NULL,
  p_category_hint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_title IS NULL OR char_length(trim(p_title)) < 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'title_too_short');
  END IF;
  IF p_description IS NULL OR char_length(trim(p_description)) < 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'description_too_short');
  END IF;
  IF p_contact_email IS NULL OR position('@' in p_contact_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  INSERT INTO public.listing_requests (
    buyer_id, title, description, quantity, category_hint, contact_email
  ) VALUES (
    v_uid,
    trim(p_title),
    trim(p_description),
    p_quantity,
    NULLIF(trim(COALESCE(p_category_hint, '')), ''),
    lower(trim(p_contact_email))
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'listing_request_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_listing_request(text, text, text, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_listing_offer(
  p_listing_request_id uuid,
  p_message text,
  p_unit_price numeric DEFAULT NULL,
  p_lead_time_days integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_supplier_id uuid;
  v_status text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT id INTO v_supplier_id
  FROM public.suppliers
  WHERE owner_id = v_uid
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_supplier');
  END IF;

  SELECT status INTO v_status
  FROM public.listing_requests
  WHERE id = p_listing_request_id;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_status <> 'open' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_open');
  END IF;
  IF p_message IS NULL OR char_length(trim(p_message)) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'message_too_short');
  END IF;

  INSERT INTO public.listing_request_offers (
    listing_request_id, supplier_id, message, unit_price, lead_time_days
  ) VALUES (
    p_listing_request_id,
    v_supplier_id,
    trim(p_message),
    p_unit_price,
    p_lead_time_days
  )
  ON CONFLICT (listing_request_id, supplier_id) DO UPDATE
    SET message = EXCLUDED.message,
        unit_price = EXCLUDED.unit_price,
        lead_time_days = EXCLUDED.lead_time_days,
        status = 'submitted',
        created_at = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'offer_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_listing_offer(uuid, text, numeric, integer) TO authenticated;
