-- Vendor listing / membership plans (Phase 17 — IndiaMART-style tiers)

CREATE TABLE IF NOT EXISTS public.listing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
    CHECK (slug IN ('free', 'starter', 'pro', 'business', 'export', 'enterprise')),
  name text NOT NULL,
  price_inr_cents_annual integer NOT NULL DEFAULT 0
    CHECK (price_inr_cents_annual >= 0),
  max_listings integer, -- NULL = unlimited
  rank_boost_bps integer NOT NULL DEFAULT 0
    CHECK (rank_boost_bps >= 0 AND rank_boost_bps <= 10000),
  rfq_leads_per_week integer NOT NULL DEFAULT 0
    CHECK (rfq_leads_per_week >= 0),
  guarantee_eligible boolean NOT NULL DEFAULT false,
  ad_wallet_bonus_inr_cents integer NOT NULL DEFAULT 0
    CHECK (ad_wallet_bonus_inr_cents >= 0),
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_plans_active_sort_idx
  ON public.listing_plans (active, sort_order);

CREATE TABLE IF NOT EXISTS public.vendor_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.listing_plans(id),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'comped', 'pending')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  stripe_subscription_id text,
  granted_by_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vendor_subscriptions_one_active_idx
  ON public.vendor_subscriptions (supplier_id)
  WHERE status IN ('active', 'comped');

CREATE UNIQUE INDEX IF NOT EXISTS vendor_subscriptions_one_pending_idx
  ON public.vendor_subscriptions (supplier_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS vendor_subscriptions_supplier_idx
  ON public.vendor_subscriptions (supplier_id);

CREATE TABLE IF NOT EXISTS public.vendor_subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  from_plan_id uuid REFERENCES public.listing_plans(id) ON DELETE SET NULL,
  to_plan_id uuid REFERENCES public.listing_plans(id) ON DELETE SET NULL,
  event_type text NOT NULL
    CHECK (event_type IN (
      'signup_default',
      'upgrade',
      'downgrade',
      'comp_grant',
      'cancel',
      'expire',
      'ops_assign',
      'upgrade_request'
    )),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_subscription_events_supplier_idx
  ON public.vendor_subscription_events (supplier_id, created_at DESC);

-- Seed MVP tiers (prices in paise / cents of INR)
INSERT INTO public.listing_plans (
  slug, name, price_inr_cents_annual, max_listings, rank_boost_bps,
  rfq_leads_per_week, guarantee_eligible, ad_wallet_bonus_inr_cents, features, sort_order
) VALUES
  ('free', 'Free', 0, 5, 0, 2, false, 0,
    '{"badge":"basic","gallery_slots":5,"product_video":false,"video_slots":0,"video_tab":false}'::jsonb, 10),
  ('starter', 'Starter', 999900, 25, 1000, 3, false, 50000,
    '{"badge":"basic","gallery_slots":15,"email_support":true,"product_video":false,"video_slots":0,"video_tab":false}'::jsonb, 20),
  ('pro', 'Pro', 2999900, 100, 2500, 10, true, 200000,
    '{"badge":"pro","gallery_slots":50,"guarantee":true,"product_video":true,"video_slots":0,"video_tab":false}'::jsonb, 30),
  ('business', 'Business', 5999900, 500, 4000, 25, true, 500000,
    '{"badge":"business","gallery_slots":100,"video_tab":true,"priority_storefront":true,"product_video":true,"video_slots":5,"custom_minisite":true}'::jsonb, 40),
  ('export', 'Export', 9999900, NULL, 5000, 40, true, 1000000,
    '{"badge":"export","gallery_slots":100,"intl_highlight":true,"usd_pricing":true,"product_video":true,"video_slots":10,"video_tab":true,"custom_minisite":true}'::jsonb, 50),
  ('enterprise', 'Enterprise', 0, NULL, 10000, 999, true, 0,
    '{"badge":"enterprise","gallery_slots":null,"dedicated_manager":true,"custom":true,"product_video":true,"video_slots":null,"video_tab":true,"custom_minisite":true}'::jsonb, 60)
ON CONFLICT (slug) DO UPDATE SET
  features = EXCLUDED.features,
  max_listings = EXCLUDED.max_listings,
  price_inr_cents_annual = EXCLUDED.price_inr_cents_annual;

ALTER TABLE public.listing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_plans_select_all ON public.listing_plans;
CREATE POLICY listing_plans_select_all ON public.listing_plans
  FOR SELECT TO anon, authenticated
  USING (active = true OR public.is_active_staff());

DROP POLICY IF EXISTS listing_plans_staff_write ON public.listing_plans;
CREATE POLICY listing_plans_staff_write ON public.listing_plans
  FOR ALL TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS vendor_subscriptions_select ON public.vendor_subscriptions;
CREATE POLICY vendor_subscriptions_select ON public.vendor_subscriptions
  FOR SELECT TO authenticated
  USING (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS vendor_subscriptions_staff_write ON public.vendor_subscriptions;
CREATE POLICY vendor_subscriptions_staff_write ON public.vendor_subscriptions
  FOR ALL TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS vendor_subscription_events_select ON public.vendor_subscription_events;
CREATE POLICY vendor_subscription_events_select ON public.vendor_subscription_events
  FOR SELECT TO authenticated
  USING (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS vendor_subscription_events_staff_insert ON public.vendor_subscription_events;
CREATE POLICY vendor_subscription_events_staff_insert ON public.vendor_subscription_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_staff());

CREATE OR REPLACE FUNCTION public.set_listing_plans_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_listing_plans_updated_at ON public.listing_plans;
CREATE TRIGGER set_listing_plans_updated_at
  BEFORE UPDATE ON public.listing_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_listing_plans_updated_at();

DROP TRIGGER IF EXISTS set_vendor_subscriptions_updated_at ON public.vendor_subscriptions;
CREATE TRIGGER set_vendor_subscriptions_updated_at
  BEFORE UPDATE ON public.vendor_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_listing_plans_updated_at();

-- Active plan helper for a supplier
CREATE OR REPLACE FUNCTION public.supplier_active_plan(p_supplier_id uuid)
RETURNS public.listing_plans
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lp.*
  FROM public.vendor_subscriptions vs
  JOIN public.listing_plans lp ON lp.id = vs.plan_id
  WHERE vs.supplier_id = p_supplier_id
    AND vs.status IN ('active', 'comped')
    AND (vs.expires_at IS NULL OR vs.expires_at > now())
  ORDER BY vs.started_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.supplier_active_plan(uuid) TO authenticated, anon;

-- Listing count vs plan max (NULL max = unlimited)
CREATE OR REPLACE FUNCTION public.supplier_can_publish_listing(p_supplier_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.listing_plans;
  v_count integer;
BEGIN
  SELECT * INTO v_plan FROM public.supplier_active_plan(p_supplier_id);
  IF NOT FOUND THEN
    -- No subscription → treat as Free defaults (5)
    SELECT count(*) INTO v_count
    FROM public.products p
    WHERE p.supplier_id = p_supplier_id AND p.status <> 'draft';
    RETURN v_count < 5;
  END IF;

  IF v_plan.max_listings IS NULL THEN
    RETURN true;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.products p
  WHERE p.supplier_id = p_supplier_id
    AND p.status <> 'draft';

  RETURN v_count < v_plan.max_listings;
END;
$$;

GRANT EXECUTE ON FUNCTION public.supplier_can_publish_listing(uuid) TO authenticated;

-- Seller chooses a plan: Free applies now; paid creates pending (ops confirms until Stripe).
CREATE OR REPLACE FUNCTION public.request_vendor_plan(p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_supplier_id uuid;
  v_plan public.listing_plans%ROWTYPE;
  v_current public.vendor_subscriptions%ROWTYPE;
  v_has_current boolean := false;
  v_event text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT id INTO v_supplier_id
  FROM public.suppliers
  WHERE owner_id = v_uid
  LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No supplier profile yet');
  END IF;

  SELECT * INTO v_plan FROM public.listing_plans WHERE id = p_plan_id AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Plan not found');
  END IF;

  SELECT * INTO v_current
  FROM public.vendor_subscriptions
  WHERE supplier_id = v_supplier_id AND status IN ('active', 'comped')
  ORDER BY started_at DESC
  LIMIT 1;
  v_has_current := FOUND;

  IF v_has_current AND v_current.plan_id = p_plan_id THEN
    RETURN jsonb_build_object('ok', true, 'mode', 'already_active', 'slug', v_plan.slug);
  END IF;

  -- Free (or ₹0 non-enterprise): apply immediately
  IF v_plan.slug = 'free' OR (v_plan.price_inr_cents_annual = 0 AND v_plan.slug <> 'enterprise') THEN
    IF v_has_current THEN
      UPDATE public.vendor_subscriptions
      SET status = 'cancelled', updated_at = now()
      WHERE id = v_current.id;
    END IF;

    UPDATE public.vendor_subscriptions
    SET status = 'cancelled', updated_at = now()
    WHERE supplier_id = v_supplier_id AND status = 'pending';

    INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status)
    VALUES (v_supplier_id, p_plan_id, 'active');

    v_event := CASE WHEN NOT v_has_current THEN 'signup_default' ELSE 'downgrade' END;
    INSERT INTO public.vendor_subscription_events (
      supplier_id, from_plan_id, to_plan_id, event_type, actor_user_id
    ) VALUES (
      v_supplier_id,
      CASE WHEN v_has_current THEN v_current.plan_id ELSE NULL END,
      p_plan_id,
      v_event,
      v_uid
    );

    RETURN jsonb_build_object('ok', true, 'mode', 'activated', 'slug', v_plan.slug);
  END IF;

  -- Paid / enterprise: replace any existing pending request
  UPDATE public.vendor_subscriptions
  SET status = 'cancelled', updated_at = now()
  WHERE supplier_id = v_supplier_id AND status = 'pending';

  INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status, notes)
  VALUES (
    v_supplier_id,
    p_plan_id,
    'pending',
    'Seller requested — confirm after payment (Stripe later)'
  );

  INSERT INTO public.vendor_subscription_events (
    supplier_id, from_plan_id, to_plan_id, event_type, actor_user_id
  ) VALUES (
    v_supplier_id,
    CASE WHEN v_has_current THEN v_current.plan_id ELSE NULL END,
    p_plan_id,
    'upgrade_request',
    v_uid
  );

  RETURN jsonb_build_object(
    'ok', true,
    'mode', 'pending',
    'slug', v_plan.slug,
    'message', 'Request sent. Keep your current plan until ops confirms payment.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_vendor_plan(uuid) TO authenticated;

-- Ops approves a pending seller plan request
CREATE OR REPLACE FUNCTION public.approve_vendor_plan_request(p_supplier_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pending public.vendor_subscriptions%ROWTYPE;
  v_current public.vendor_subscriptions%ROWTYPE;
  v_has_current boolean := false;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Staff only');
  END IF;

  SELECT * INTO v_pending
  FROM public.vendor_subscriptions
  WHERE supplier_id = p_supplier_id AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No pending request');
  END IF;

  SELECT * INTO v_current
  FROM public.vendor_subscriptions
  WHERE supplier_id = p_supplier_id AND status IN ('active', 'comped')
  ORDER BY started_at DESC
  LIMIT 1;
  v_has_current := FOUND;

  IF v_has_current THEN
    UPDATE public.vendor_subscriptions
    SET status = 'cancelled', updated_at = now()
    WHERE id = v_current.id;
  END IF;

  UPDATE public.vendor_subscriptions
  SET status = 'active',
      granted_by_staff_id = v_uid,
      notes = coalesce(notes, '') || ' · approved by ops',
      updated_at = now()
  WHERE id = v_pending.id;

  INSERT INTO public.vendor_subscription_events (
    supplier_id, from_plan_id, to_plan_id, event_type, actor_user_id
  ) VALUES (
    p_supplier_id,
    CASE WHEN v_has_current THEN v_current.plan_id ELSE NULL END,
    v_pending.plan_id,
    'ops_assign',
    v_uid
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_vendor_plan_request(uuid) TO authenticated;

-- Auto-assign Free plan when a supplier is created
CREATE OR REPLACE FUNCTION public.assign_free_plan_on_supplier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
BEGIN
  SELECT id INTO v_plan_id FROM public.listing_plans WHERE slug = 'free' AND active LIMIT 1;
  IF v_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status)
  VALUES (NEW.id, v_plan_id, 'active');

  INSERT INTO public.vendor_subscription_events (
    supplier_id, to_plan_id, event_type, actor_user_id
  ) VALUES (NEW.id, v_plan_id, 'signup_default', NEW.owner_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS suppliers_assign_free_plan ON public.suppliers;
CREATE TRIGGER suppliers_assign_free_plan
  AFTER INSERT ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.assign_free_plan_on_supplier();

-- Backfill Free for existing suppliers without a subscription
INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status)
SELECT s.id, lp.id, 'active'
FROM public.suppliers s
CROSS JOIN public.listing_plans lp
WHERE lp.slug = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM public.vendor_subscriptions vs
    WHERE vs.supplier_id = s.id AND vs.status IN ('active', 'comped')
  );
