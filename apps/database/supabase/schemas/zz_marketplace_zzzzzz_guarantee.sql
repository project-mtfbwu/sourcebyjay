-- Phase 9: SourceByJay Guarantee (Alibaba Trade Assurance parallel)
-- Escrow is fake until Phase 10 Stripe; disputes + badges ship now.

CREATE TABLE IF NOT EXISTS public.guarantee_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  coverage_quality boolean NOT NULL DEFAULT true,
  coverage_shipping boolean NOT NULL DEFAULT true,
  dispute_days integer NOT NULL DEFAULT 30 CHECK (dispute_days > 0 AND dispute_days <= 365),
  max_order_inr_cents bigint,
  max_order_usd_cents bigint,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.guarantee_policies (id, name, coverage_quality, coverage_shipping, dispute_days, max_order_inr_cents, max_order_usd_cents, active)
VALUES (
  'a1000001-0000-4000-8000-000000000001',
  'Standard SourceByJay Guarantee',
  true,
  true,
  30,
  50000000, -- ₹5L reference UX (IndiaMART-style cap display)
  1000000,  -- $10,000
  true
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS guarantee_ops_override boolean,
  ADD COLUMN IF NOT EXISTS guarantee_policy_id uuid REFERENCES public.guarantee_policies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.suppliers.guarantee_ops_override IS
  'NULL = use listing plan; true = force eligible; false = force ineligible';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guarantee_protected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guarantee_policy_id uuid REFERENCES public.guarantee_policies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'none'
    CHECK (escrow_status IN ('none', 'held', 'released', 'refunded', 'disputed')),
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_guarantee_idx ON public.orders (guarantee_protected)
  WHERE guarantee_protected = true;

CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL
    CHECK (reason IN (
      'quality_mismatch',
      'not_shipped',
      'wrong_quantity',
      'damaged',
      'non_delivery',
      'gst_invoice',
      'other'
    )),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under_review', 'resolved', 'rejected', 'cancelled')),
  resolution text
    CHECK (resolution IS NULL OR resolution IN ('full_refund', 'partial_refund', 'reject', 'withdrawn')),
  refund_amount_cents bigint,
  buyer_note text,
  assigned_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS disputes_one_open_per_order_idx
  ON public.disputes (order_id)
  WHERE status IN ('open', 'under_review');

CREATE INDEX IF NOT EXISTS disputes_status_idx ON public.disputes (status, created_at DESC);
CREATE INDEX IF NOT EXISTS disputes_order_idx ON public.disputes (order_id);

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('buyer', 'vendor', 'ops', 'system')),
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dispute_messages_dispute_idx
  ON public.dispute_messages (dispute_id, created_at);

ALTER TABLE public.guarantee_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guarantee_policies_select_all ON public.guarantee_policies;
CREATE POLICY guarantee_policies_select_all ON public.guarantee_policies
  FOR SELECT TO anon, authenticated
  USING (active = true OR public.is_active_staff());

DROP POLICY IF EXISTS guarantee_policies_write_staff ON public.guarantee_policies;
CREATE POLICY guarantee_policies_write_staff ON public.guarantee_policies
  FOR ALL TO authenticated
  USING (public.staff_has_min_role('manager'))
  WITH CHECK (public.staff_has_min_role('manager'));

-- True when supplier may show Guarantee badge / protect on-platform orders
CREATE OR REPLACE FUNCTION public.supplier_is_guarantee_eligible(p_supplier_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override boolean;
  v_plan public.listing_plans;
BEGIN
  SELECT guarantee_ops_override INTO v_override
  FROM public.suppliers
  WHERE id = p_supplier_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  SELECT * INTO v_plan FROM public.supplier_active_plan(p_supplier_id);
  IF FOUND THEN
    RETURN coalesce(v_plan.guarantee_eligible, false);
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.supplier_is_guarantee_eligible(uuid) TO authenticated, anon;

-- Active default policy
CREATE OR REPLACE FUNCTION public.active_guarantee_policy()
RETURNS public.guarantee_policies
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.guarantee_policies
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.active_guarantee_policy() TO authenticated, anon;

-- Replace 1-arg fake pay (avoid ambiguous overloads) with terms flag
DROP FUNCTION IF EXISTS public.fake_mark_order_paid(uuid);

-- Extend fake pay: set guarantee_protected + escrow held when eligible + terms accepted
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
      notes = coalesce(notes, '') || ' · marked paid via fake slab',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  UPDATE public.orders
  SET status = 'paid',
      updated_at = now(),
      guarantee_protected = v_protected,
      guarantee_policy_id = CASE WHEN v_protected THEN v_policy.id ELSE NULL END,
      escrow_status = CASE WHEN v_protected THEN 'held' ELSE 'none' END
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (
    p_order_id,
    v_from,
    'paid',
    CASE
      WHEN v_protected THEN 'TEST MODE fake payment — SourceByJay Guarantee escrow held (fake)'
      WHEN v_eligible AND NOT p_accept_guarantee_terms THEN
        'TEST MODE fake payment — Guarantee available but terms not accepted (not protected)'
      ELSE 'TEST MODE fake payment — not real money · not Guarantee-eligible'
    END,
    v_uid
  );

  IF v_protected THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      v_uid,
      'guarantee.escrow_held_fake',
      'order',
      p_order_id::text,
      jsonb_build_object('policy_id', v_policy.id, 'mode', 'fake')
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'mode', 'fake',
    'guarantee_protected', v_protected,
    'guarantee_eligible', v_eligible
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fake_mark_order_paid(uuid, boolean) TO authenticated;

-- When order reaches delivered, stamp delivered_at for dispute window
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
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  v_from := v_order.status;
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
        WHEN guarantee_protected AND p_to_status = 'completed' AND escrow_status = 'held'
          THEN 'released'
        ELSE escrow_status
      END
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, from_status, to_status, note, actor_user_id)
  VALUES (p_order_id, v_from, p_to_status, p_note, v_uid);

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text, text) TO authenticated;

-- Buyer opens dispute on Guarantee-protected order within window
CREATE OR REPLACE FUNCTION public.open_order_dispute(
  p_order_id uuid,
  p_reason text,
  p_buyer_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_policy public.guarantee_policies;
  v_days integer := 30;
  v_dispute_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.buyer_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found');
  END IF;

  IF NOT v_order.guarantee_protected THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order is not covered by SourceByJay Guarantee');
  END IF;

  IF v_order.status NOT IN ('shipped', 'delivered', 'completed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute opens after shipment or delivery');
  END IF;

  IF v_order.guarantee_policy_id IS NOT NULL THEN
    SELECT * INTO v_policy FROM public.guarantee_policies WHERE id = v_order.guarantee_policy_id;
    IF FOUND THEN
      v_days := v_policy.dispute_days;
    END IF;
  END IF;

  IF v_order.delivered_at IS NOT NULL
     AND v_order.delivered_at < (now() - make_interval(days => v_days)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute window has closed');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.order_id = p_order_id AND d.status IN ('open', 'under_review')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'A dispute is already open for this order');
  END IF;

  IF p_reason NOT IN (
    'quality_mismatch', 'not_shipped', 'wrong_quantity', 'damaged',
    'non_delivery', 'gst_invoice', 'other'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid reason');
  END IF;

  INSERT INTO public.disputes (order_id, opened_by, reason, buyer_note, status)
  VALUES (p_order_id, v_uid, p_reason, nullif(trim(coalesce(p_buyer_note, '')), ''), 'open')
  RETURNING id INTO v_dispute_id;

  UPDATE public.orders
  SET escrow_status = 'disputed', updated_at = now()
  WHERE id = p_order_id AND escrow_status IN ('held', 'none');

  INSERT INTO public.dispute_messages (dispute_id, sender_id, sender_type, body)
  VALUES (
    v_dispute_id,
    v_uid,
    'buyer',
    coalesce(nullif(trim(coalesce(p_buyer_note, '')), ''), 'Dispute opened: ' || p_reason)
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'guarantee.dispute_opened',
    'dispute',
    v_dispute_id::text,
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('ok', true, 'dispute_id', v_dispute_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_order_dispute(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_dispute_message(
  p_dispute_id uuid,
  p_body text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_dispute public.disputes%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_sender_type text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  IF length(trim(coalesce(p_body, ''))) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Message required');
  END IF;

  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute not found');
  END IF;

  IF v_dispute.status NOT IN ('open', 'under_review') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute is closed');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_dispute.order_id;

  IF public.is_active_staff() THEN
    v_sender_type := 'ops';
  ELSIF v_order.buyer_id = v_uid THEN
    v_sender_type := 'buyer';
  ELSIF EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = v_order.supplier_id AND s.owner_id = v_uid
  ) THEN
    v_sender_type := 'vendor';
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed');
  END IF;

  INSERT INTO public.dispute_messages (dispute_id, sender_id, sender_type, body)
  VALUES (p_dispute_id, v_uid, v_sender_type, trim(p_body));

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_dispute_message(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_dispute(
  p_dispute_id uuid,
  p_resolution text,
  p_refund_amount_cents bigint DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_dispute public.disputes%ROWTYPE;
  v_new_status text;
  v_escrow text;
BEGIN
  IF v_uid IS NULL OR NOT public.staff_has_min_role('manager') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Manager+ staff only');
  END IF;

  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute not found');
  END IF;

  IF v_dispute.status NOT IN ('open', 'under_review') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dispute already closed');
  END IF;

  IF p_resolution NOT IN ('full_refund', 'partial_refund', 'reject', 'withdrawn') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid resolution');
  END IF;

  v_new_status := CASE WHEN p_resolution = 'reject' THEN 'rejected' ELSE 'resolved' END;
  v_escrow := CASE
    WHEN p_resolution IN ('full_refund', 'partial_refund') THEN 'refunded'
    ELSE 'released'
  END;

  UPDATE public.disputes
  SET status = v_new_status,
      resolution = p_resolution,
      refund_amount_cents = p_refund_amount_cents,
      assigned_staff_id = coalesce(assigned_staff_id, v_uid),
      resolved_at = now(),
      updated_at = now()
  WHERE id = p_dispute_id;

  UPDATE public.orders
  SET escrow_status = v_escrow, updated_at = now()
  WHERE id = v_dispute.order_id;

  INSERT INTO public.dispute_messages (dispute_id, sender_id, sender_type, body)
  VALUES (
    p_dispute_id,
    v_uid,
    'ops',
    coalesce(nullif(trim(coalesce(p_note, '')), ''), 'Resolved: ' || p_resolution)
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'guarantee.dispute_resolved',
    'dispute',
    p_dispute_id::text,
    jsonb_build_object(
      'resolution', p_resolution,
      'refund_amount_cents', p_refund_amount_cents,
      'order_id', v_dispute.order_id
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_dispute(uuid, text, bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_supplier_guarantee_override(
  p_supplier_id uuid,
  p_override boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.staff_has_min_role('manager') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Manager+ staff only');
  END IF;

  UPDATE public.suppliers
  SET guarantee_ops_override = p_override,
      updated_at = now()
  WHERE id = p_supplier_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Supplier not found');
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_uid,
    'guarantee.ops_override',
    'supplier',
    p_supplier_id::text,
    jsonb_build_object('override', p_override)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_supplier_guarantee_override(uuid, boolean) TO authenticated;

-- Disputes RLS
DROP POLICY IF EXISTS disputes_select ON public.disputes;
CREATE POLICY disputes_select ON public.disputes
  FOR SELECT TO authenticated
  USING (
    public.is_active_staff()
    OR opened_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.suppliers s ON s.id = o.supplier_id
      WHERE o.id = disputes.order_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS dispute_messages_select ON public.dispute_messages;
CREATE POLICY dispute_messages_select ON public.dispute_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_messages.dispute_id
        AND (
          public.is_active_staff()
          OR d.opened_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.suppliers s ON s.id = o.supplier_id
            WHERE o.id = d.order_id AND s.owner_id = auth.uid()
          )
        )
    )
  );

-- Writes go through SECURITY DEFINER RPCs
DROP POLICY IF EXISTS disputes_no_direct_insert ON public.disputes;
CREATE POLICY disputes_no_direct_insert ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS dispute_messages_no_direct_insert ON public.dispute_messages;
CREATE POLICY dispute_messages_no_direct_insert ON public.dispute_messages
  FOR INSERT TO authenticated
  WITH CHECK (false);

DROP TRIGGER IF EXISTS set_guarantee_policies_updated_at ON public.guarantee_policies;
CREATE TRIGGER set_guarantee_policies_updated_at
  BEFORE UPDATE ON public.guarantee_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_disputes_updated_at ON public.disputes;
CREATE TRIGGER set_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
