-- Phase 10A: fake payment rehearsal (Alibaba Trade Assurance structure, no Stripe yet)
-- Pay on platform → escrow HELD → release to seller OR return to buyer + invoice

-- ---------------------------------------------------------------------------
-- Invoices (one per paid order)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  buyer_id uuid NOT NULL REFERENCES auth.users (id),
  supplier_id uuid NOT NULL REFERENCES public.suppliers (id),
  currency text NOT NULL DEFAULT 'INR',
  subtotal numeric(14, 2) NOT NULL,
  total numeric(14, 2) NOT NULL,
  line_summary text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued', 'voided')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_invoices_buyer_idx ON public.order_invoices (buyer_id);
CREATE INDEX IF NOT EXISTS order_invoices_supplier_idx ON public.order_invoices (supplier_id);

ALTER TABLE public.order_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_invoices_select ON public.order_invoices;
CREATE POLICY order_invoices_select ON public.order_invoices
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = order_invoices.supplier_id AND s.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Escrow ledger (hold / release / return) — fake money trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.escrow_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  entry_type text NOT NULL
    CHECK (entry_type IN ('hold', 'release_to_seller', 'return_to_buyer', 'dispute_hold')),
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  actor_user_id uuid REFERENCES auth.users (id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS escrow_ledger_order_idx
  ON public.escrow_ledger_entries (order_id, created_at);

ALTER TABLE public.escrow_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escrow_ledger_select ON public.escrow_ledger_entries;
CREATE POLICY escrow_ledger_select ON public.escrow_ledger_entries
  FOR SELECT TO authenticated
  USING (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = escrow_ledger_entries.order_id
        AND (
          o.buyer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.suppliers s
            WHERE s.id = o.supplier_id AND s.owner_id = auth.uid()
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Fake buyer wallet credits (= "money returned to buyer")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buyer_fake_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users (id),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  reason text NOT NULL DEFAULT 'refund'
    CHECK (reason IN ('refund', 'cancel_paid', 'dispute_refund')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS buyer_fake_credits_buyer_idx
  ON public.buyer_fake_credits (buyer_id, created_at DESC);

ALTER TABLE public.buyer_fake_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS buyer_fake_credits_select ON public.buyer_fake_credits;
CREATE POLICY buyer_fake_credits_select ON public.buyer_fake_credits
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR public.is_active_staff());

-- ---------------------------------------------------------------------------
-- Helper: next invoice number SBJ-INV-YYYYMMDD-####
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day text := to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  v_seq int;
BEGIN
  SELECT count(*)::int + 1 INTO v_seq
  FROM public.order_invoices
  WHERE invoice_number LIKE 'SBJ-INV-' || v_day || '-%';
  RETURN 'SBJ-INV-' || v_day || '-' || lpad(v_seq::text, 4, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- Fake pay: ALWAYS hold escrow (Alibaba: pay on platform → held) + invoice
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fake_mark_order_paid(
  p_order_id uuid,
  p_accept_guarantee_terms boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_from text;
  v_eligible boolean;
  v_policy public.guarantee_policies;
  v_protected boolean := false;
  v_inv text;
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
  v_eligible := public.supplier_is_guarantee_eligible(v_order.supplier_id);
  SELECT * INTO v_policy FROM public.active_guarantee_policy();

  IF v_eligible AND p_accept_guarantee_terms AND FOUND THEN
    v_protected := true;
  END IF;

  UPDATE public.payments
  SET status = 'paid',
      marked_paid_by = v_uid,
      marked_paid_at = now(),
      notes = coalesce(notes, '') || ' · marked paid via fake slab (escrow held)',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  -- Alibaba parallel: on-platform pay → funds held in escrow (fake)
  UPDATE public.orders
  SET status = 'paid',
      updated_at = now(),
      guarantee_protected = v_protected,
      guarantee_policy_id = CASE WHEN v_protected THEN v_policy.id ELSE NULL END,
      escrow_status = 'held'
  WHERE id = p_order_id;

  INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
  VALUES (
    p_order_id,
    'hold',
    v_order.total_amount,
    v_order.currency,
    v_uid,
    'TEST MODE — fake funds held in platform escrow'
  );

  -- Invoice (skip if already exists)
  IF NOT EXISTS (SELECT 1 FROM public.order_invoices WHERE order_id = p_order_id) THEN
    v_inv := public.next_invoice_number();
    INSERT INTO public.order_invoices (
      order_id, invoice_number, buyer_id, supplier_id,
      currency, subtotal, total, line_summary, status
    )
    VALUES (
      p_order_id,
      v_inv,
      v_order.buyer_id,
      v_order.supplier_id,
      v_order.currency,
      v_order.total_amount,
      v_order.total_amount,
      'Qty ' || v_order.quantity::text || CASE WHEN v_order.is_sample THEN ' (sample)' ELSE '' END,
      'issued'
    );
  ELSE
    SELECT invoice_number INTO v_inv FROM public.order_invoices WHERE order_id = p_order_id;
  END IF;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_from,
    'paid',
    CASE
      WHEN v_protected THEN
        'TEST MODE fake payment — escrow held · Guarantee on · invoice ' || coalesce(v_inv, '')
      ELSE
        'TEST MODE fake payment — escrow held · invoice ' || coalesce(v_inv, '')
    END,
    v_uid
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'payment.fake_escrow_held',
    'order',
    p_order_id::text,
    jsonb_build_object(
      'mode', 'fake',
      'guarantee_protected', v_protected,
      'invoice_number', v_inv
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'mode', 'fake',
    'guarantee_protected', v_protected,
    'guarantee_eligible', v_eligible,
    'escrow_status', 'held',
    'invoice_number', v_inv
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fake_mark_order_paid(uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- Buyer cancel unpaid order (Alibaba: unpaid → cancel)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_unpaid_order(p_order_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF v_order.buyer_id <> v_uid AND NOT public.is_active_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only buyer or ops can cancel unpaid');
  END IF;

  IF v_order.status NOT IN ('awaiting_payment', 'pending_confirmation', 'confirmed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only unpaid orders can use cancel-unpaid');
  END IF;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments
  SET status = 'failed',
      notes = coalesce(notes, '') || ' · cancelled unpaid',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_order.status,
    'cancelled',
    coalesce(nullif(trim(p_note), ''), 'Buyer cancelled unpaid order'),
    v_uid
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_unpaid_order(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Return escrow to buyer (fake refund) — buyer request or ops
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.return_escrow_to_buyer(
  p_order_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_is_owner boolean := false;
  v_allowed boolean := false;
  v_reason text := 'refund';
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  v_is_owner := EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid
  );

  -- Buyer: paid / early fulfillment (Alibaba apply-for-refund path)
  IF v_order.buyer_id = v_uid
     AND v_order.escrow_status IN ('held', 'disputed')
     AND v_order.status IN ('paid', 'in_production', 'shipped', 'delivered') THEN
    v_allowed := true;
    v_reason := 'refund';
  ELSIF public.is_active_staff()
     AND v_order.escrow_status IN ('held', 'disputed')
     AND v_order.status NOT IN ('cancelled') THEN
    v_allowed := true;
    v_reason := 'refund';
  END IF;

  -- seller cannot self-refund (ops/buyer only)
  IF v_is_owner AND NOT public.is_active_staff() AND v_order.buyer_id <> v_uid THEN
    v_allowed := false;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Refund / return not allowed for this order');
  END IF;

  IF v_order.escrow_status = 'refunded' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Already returned to buyer');
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      escrow_status = 'refunded',
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments
  SET status = 'refunded',
      notes = coalesce(notes, '') || ' · fake refund returned to buyer',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'paid';

  UPDATE public.order_invoices
  SET status = 'voided'
  WHERE order_id = p_order_id AND status = 'issued';

  INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
  VALUES (
    p_order_id,
    'return_to_buyer',
    v_order.total_amount,
    v_order.currency,
    v_uid,
    coalesce(nullif(trim(p_note), ''), 'TEST MODE — fake funds returned to buyer')
  );

  INSERT INTO public.buyer_fake_credits (buyer_id, order_id, amount, currency, reason, note)
  VALUES (
    v_order.buyer_id,
    p_order_id,
    v_order.total_amount,
    v_order.currency,
    v_reason,
    coalesce(nullif(trim(p_note), ''), 'Returned to buyer (fake wallet)')
  );

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_order.status,
    'cancelled',
    'Escrow returned to buyer (fake) · ' || coalesce(nullif(trim(p_note), ''), 'refund'),
    v_uid
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'payment.fake_return_to_buyer',
    'order',
    p_order_id::text,
    jsonb_build_object('amount', v_order.total_amount, 'mode', 'fake')
  );

  RETURN jsonb_build_object(
    'ok', true,
    'escrow_status', 'refunded',
    'returned_to_buyer', true,
    'amount', v_order.total_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.return_escrow_to_buyer(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Ops / completion: release escrow to seller (fake)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_escrow_to_seller(
  p_order_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF NOT public.is_active_staff()
     AND NOT (v_order.buyer_id = v_uid AND v_order.status IN ('delivered', 'completed')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ops or buyer (after delivered) only');
  END IF;

  IF v_order.escrow_status <> 'held' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escrow is not held');
  END IF;

  UPDATE public.orders
  SET escrow_status = 'released',
      status = CASE WHEN status = 'delivered' THEN 'completed' ELSE status END,
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
  VALUES (
    p_order_id,
    'release_to_seller',
    v_order.total_amount,
    v_order.currency,
    v_uid,
    coalesce(nullif(trim(p_note), ''), 'TEST MODE — fake escrow released to seller')
  );

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_order.status,
    CASE WHEN v_order.status = 'delivered' THEN 'completed' ELSE v_order.status END,
    'Escrow released to seller (fake)',
    v_uid
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'payment.fake_escrow_released',
    'order',
    p_order_id::text,
    jsonb_build_object('amount', v_order.total_amount, 'mode', 'fake')
  );

  RETURN jsonb_build_object('ok', true, 'escrow_status', 'released');
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_escrow_to_seller(uuid, text) TO authenticated;

-- Keep update_order_status escrow release on completed (guarantee file) — also log ledger when completed
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
  v_from text;
  v_is_owner boolean := false;
  v_prev_escrow text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  v_from := v_order.status;
  v_prev_escrow := v_order.escrow_status;
  v_is_owner := EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid
  );

  IF public.is_active_staff() THEN
    v_allowed := true;
  ELSIF v_is_owner THEN
    v_allowed := (
      (v_from = 'paid' AND p_to_status = 'in_production')
      OR (v_from = 'in_production' AND p_to_status = 'shipped')
      OR (v_from = 'shipped' AND p_to_status = 'delivered')
      OR (v_from = 'delivered' AND p_to_status = 'completed')
      OR (v_from = 'awaiting_payment' AND p_to_status = 'confirmed')
      OR (p_to_status = 'cancelled' AND v_from NOT IN ('completed', 'cancelled'))
    );
  ELSIF v_order.buyer_id = v_uid AND v_from = 'delivered' AND p_to_status = 'completed' THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Status change not allowed');
  END IF;

  IF p_to_status NOT IN (
    'pending_confirmation', 'confirmed', 'awaiting_payment', 'paid',
    'in_production', 'shipped', 'delivered', 'completed', 'cancelled'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid status');
  END IF;

  UPDATE public.orders
  SET status = p_to_status,
      updated_at = now(),
      delivered_at = CASE
        WHEN p_to_status = 'delivered' AND delivered_at IS NULL THEN now()
        ELSE delivered_at
      END,
      escrow_status = CASE
        WHEN p_to_status = 'completed' AND escrow_status = 'held'
          THEN 'released'
        ELSE escrow_status
      END
  WHERE id = p_order_id;

  IF p_to_status = 'completed' AND v_prev_escrow = 'held' THEN
    INSERT INTO public.escrow_ledger_entries (order_id, entry_type, amount, currency, actor_user_id, note)
    VALUES (
      p_order_id,
      'release_to_seller',
      v_order.total_amount,
      v_order.currency,
      v_uid,
      'Auto-release on order completed (fake)'
    );
  END IF;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_from, p_to_status, p_note, v_uid);

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text, text) TO authenticated;
