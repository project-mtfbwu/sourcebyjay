-- Phase 3: quotes → orders → fake payments (Stripe later)

-- Sellers need to read RFQs for their suppliers
DROP POLICY IF EXISTS inquiries_select_supplier ON public.inquiries;
CREATE POLICY inquiries_select_supplier ON public.inquiries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = inquiries.supplier_id AND s.owner_id = auth.uid()
    )
    OR public.is_active_staff()
  );

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  currency text NOT NULL DEFAULT 'INR',
  quantity integer NOT NULL CHECK (quantity > 0),
  lead_time_days integer NOT NULL DEFAULT 14 CHECK (lead_time_days >= 0),
  valid_until date,
  is_sample boolean NOT NULL DEFAULT false,
  notes text,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quotes_supplier_idx ON public.quotes (supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quotes_buyer_idx ON public.quotes (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quotes_inquiry_idx ON public.quotes (inquiry_id);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  total_amount numeric(14, 2) NOT NULL CHECK (total_amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  quantity integer NOT NULL CHECK (quantity > 0),
  is_sample boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN (
      'pending_confirmation',
      'confirmed',
      'awaiting_payment',
      'paid',
      'in_production',
      'shipped',
      'delivered',
      'completed',
      'cancelled'
    )),
  commission_rate_bps integer NOT NULL DEFAULT 500
    CHECK (commission_rate_bps >= 0 AND commission_rate_bps <= 10000),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_buyer_idx ON public.orders (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_supplier_idx ON public.orders (supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);

CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_idx ON public.order_events (order_id, created_at);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'fake'
    CHECK (provider IN ('fake', 'stripe')),
  amount numeric(14, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  marked_paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  marked_paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_one_per_order_idx ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Quotes RLS
DROP POLICY IF EXISTS quotes_select ON public.quotes;
CREATE POLICY quotes_select ON public.quotes
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quotes_insert_seller ON public.quotes;
CREATE POLICY quotes_insert_seller ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quotes_update_parties ON public.quotes;
CREATE POLICY quotes_update_parties ON public.quotes
  FOR UPDATE TO authenticated
  USING (
    buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

-- Orders RLS
DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select ON public.orders
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS orders_update_parties ON public.orders;
CREATE POLICY orders_update_parties ON public.orders
  FOR UPDATE TO authenticated
  USING (
    buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

-- Order events: append-only for parties
DROP POLICY IF EXISTS order_events_select ON public.order_events;
CREATE POLICY order_events_select ON public.order_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.buyer_id = auth.uid()
          OR public.is_active_staff()
          OR EXISTS (
            SELECT 1 FROM public.suppliers s
            WHERE s.id = o.supplier_id AND s.owner_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS order_events_insert ON public.order_events;
CREATE POLICY order_events_insert ON public.order_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.buyer_id = auth.uid()
          OR public.is_active_staff()
          OR EXISTS (
            SELECT 1 FROM public.suppliers s
            WHERE s.id = o.supplier_id AND s.owner_id = auth.uid()
          )
        )
    )
  );

-- Payments RLS
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.buyer_id = auth.uid()
          OR public.is_active_staff()
          OR EXISTS (
            SELECT 1 FROM public.suppliers s
            WHERE s.id = o.supplier_id AND s.owner_id = auth.uid()
          )
        )
    )
  );

DROP TRIGGER IF EXISTS set_quotes_updated_at ON public.quotes;
CREATE TRIGGER set_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON TABLE public.quotes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
-- Seller creates a quote from an inquiry (or ad-hoc against a buyer)
CREATE OR REPLACE FUNCTION public.create_quote(
  p_inquiry_id uuid,
  p_unit_price numeric,
  p_quantity integer,
  p_lead_time_days integer,
  p_valid_until date,
  p_notes text,
  p_is_sample boolean DEFAULT false,
  p_currency text DEFAULT 'INR'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inq public.inquiries%ROWTYPE;
  v_supplier_id uuid;
  v_quote_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_inq FROM public.inquiries WHERE id = p_inquiry_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Inquiry not found');
  END IF;

  IF v_inq.supplier_id IS NULL OR v_inq.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Inquiry missing buyer or supplier');
  END IF;

  SELECT id INTO v_supplier_id
  FROM public.suppliers
  WHERE id = v_inq.supplier_id AND owner_id = v_uid;
  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not your inquiry');
  END IF;

  IF p_unit_price IS NULL OR p_unit_price < 0 OR p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Price and quantity required');
  END IF;

  INSERT INTO public.quotes (
    inquiry_id, supplier_id, buyer_id, product_id,
    unit_price, currency, quantity, lead_time_days, valid_until,
    is_sample, notes, status, created_by
  ) VALUES (
    p_inquiry_id, v_supplier_id, v_inq.user_id, v_inq.product_id,
    p_unit_price, coalesce(nullif(trim(p_currency), ''), 'INR'), p_quantity,
    coalesce(p_lead_time_days, 14), p_valid_until,
    coalesce(p_is_sample, false), nullif(trim(p_notes), ''), 'sent', v_uid
  )
  RETURNING id INTO v_quote_id;

  RETURN jsonb_build_object('ok', true, 'quote_id', v_quote_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_quote(uuid, numeric, integer, integer, date, text, boolean, text) TO authenticated;

-- Buyer accepts quote → order + pending fake payment
CREATE OR REPLACE FUNCTION public.accept_quote(p_quote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_quote public.quotes%ROWTYPE;
  v_order_id uuid;
  v_commission integer;
  v_total numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote not found');
  END IF;
  IF v_quote.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not your quote');
  END IF;
  IF v_quote.status <> 'sent' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote is not open for accept');
  END IF;
  IF v_quote.valid_until IS NOT NULL AND v_quote.valid_until < current_date THEN
    UPDATE public.quotes SET status = 'expired', updated_at = now() WHERE id = p_quote_id;
    RETURN jsonb_build_object('ok', false, 'error', 'Quote expired');
  END IF;

  SELECT commission_rate_bps INTO v_commission
  FROM public.suppliers WHERE id = v_quote.supplier_id;
  v_commission := coalesce(v_commission, 500);
  v_total := round(v_quote.unit_price * v_quote.quantity, 2);

  UPDATE public.quotes SET status = 'accepted', updated_at = now() WHERE id = p_quote_id;

  INSERT INTO public.orders (
    quote_id, inquiry_id, buyer_id, supplier_id, product_id,
    total_amount, currency, quantity, is_sample, status, commission_rate_bps
  ) VALUES (
    v_quote.id, v_quote.inquiry_id, v_quote.buyer_id, v_quote.supplier_id, v_quote.product_id,
    v_total, v_quote.currency, v_quote.quantity, v_quote.is_sample,
    'awaiting_payment', v_commission
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (v_order_id, null, 'awaiting_payment', 'Buyer accepted quote', v_uid);

  INSERT INTO public.payments (order_id, provider, amount, currency, status, notes)
  VALUES (
    v_order_id, 'fake', v_total, v_quote.currency, 'pending',
    'TEST MODE — fake payment slab until Stripe (Phase 10)'
  );

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_quote(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_quote(p_quote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_quote public.quotes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;
  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND OR v_quote.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote not found');
  END IF;
  IF v_quote.status <> 'sent' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quote is not open');
  END IF;
  UPDATE public.quotes SET status = 'rejected', updated_at = now() WHERE id = p_quote_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_quote(uuid) TO authenticated;

-- Fake payment: buyer or staff marks paid (no Stripe)
CREATE OR REPLACE FUNCTION public.fake_mark_order_paid(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_from text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF v_order.buyer_id <> v_uid AND NOT public.is_active_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only buyer or ops can mark paid (test)');
  END IF;

  IF v_order.status NOT IN ('awaiting_payment', 'pending_confirmation', 'confirmed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order is not awaiting payment');
  END IF;

  v_from := v_order.status;

  UPDATE public.payments
  SET status = 'paid',
      marked_paid_by = v_uid,
      marked_paid_at = now(),
      notes = coalesce(notes, '') || ' · marked paid via fake slab',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  UPDATE public.orders
  SET status = 'paid', updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_from, 'paid', 'TEST MODE fake payment — not real money', v_uid);

  RETURN jsonb_build_object('ok', true, 'mode', 'fake');
END;
$$;

GRANT EXECUTE ON FUNCTION public.fake_mark_order_paid(uuid) TO authenticated;

-- Seller advances fulfillment status after paid
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_to_status text, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_allowed boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF NOT (
    public.is_active_staff()
    OR EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Seller or staff only');
  END IF;

  IF p_to_status = 'cancelled' AND v_order.status NOT IN ('completed', 'cancelled') THEN
    v_allowed := true;
  ELSIF v_order.status = 'paid' AND p_to_status = 'in_production' THEN
    v_allowed := true;
  ELSIF v_order.status = 'in_production' AND p_to_status = 'shipped' THEN
    v_allowed := true;
  ELSIF v_order.status = 'shipped' AND p_to_status = 'delivered' THEN
    v_allowed := true;
  ELSIF v_order.status = 'delivered' AND p_to_status = 'completed' THEN
    v_allowed := true;
  ELSIF v_order.status = 'awaiting_payment' AND p_to_status = 'confirmed' THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid status transition');
  END IF;

  UPDATE public.orders SET status = p_to_status, updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_order.status, p_to_status, nullif(trim(p_note), ''), v_uid);

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text, text) TO authenticated;
