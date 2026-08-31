-- Phase 13: Hybrid ad engine (CPC + CPM + sponsorship) — fake wallet + ad invoices

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.ad_billing_model AS ENUM ('cpc', 'cpm', 'sponsorship');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ad_campaign_status AS ENUM ('draft', 'active', 'paused', 'ended', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ad_wallet_tx_type AS ENUM (
    'top_up',
    'cpc_charge',
    'cpm_charge',
    'sponsorship_charge',
    'ops_credit',
    'refund'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ad_invoice_type AS ENUM (
    'wallet_receipt',
    'spend_statement',
    'service_invoice',
    'credit_note'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Wallets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_wallets (
  supplier_id uuid PRIMARY KEY REFERENCES public.suppliers (id) ON DELETE CASCADE,
  balance_inr_cents bigint NOT NULL DEFAULT 0 CHECK (balance_inr_cents >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_wallets_select ON public.ad_wallets;
CREATE POLICY ad_wallets_select ON public.ad_wallets
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_wallets.supplier_id AND s.owner_id = auth.uid())
    OR public.is_active_staff()
  );

CREATE TABLE IF NOT EXISTS public.ad_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers (id) ON DELETE CASCADE,
  amount_inr_cents bigint NOT NULL,
  tx_type public.ad_wallet_tx_type NOT NULL,
  balance_after_inr_cents bigint NOT NULL,
  campaign_id uuid,
  ad_click_id uuid,
  ad_impression_id uuid,
  ad_invoice_id uuid,
  note text,
  created_by_user_id uuid REFERENCES auth.users (id),
  created_by_staff_id uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_wallet_tx_supplier_idx
  ON public.ad_wallet_transactions (supplier_id, created_at DESC);

ALTER TABLE public.ad_wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_wallet_tx_select ON public.ad_wallet_transactions;
CREATE POLICY ad_wallet_tx_select ON public.ad_wallet_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_wallet_transactions.supplier_id AND s.owner_id = auth.uid())
    OR public.is_active_staff()
  );

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) >= 2),
  status public.ad_campaign_status NOT NULL DEFAULT 'draft',
  billing_model public.ad_billing_model NOT NULL DEFAULT 'cpc',
  placement_types text[] NOT NULL DEFAULT '{search_results_top}',
  max_cpc_bid_inr_cents bigint CHECK (max_cpc_bid_inr_cents IS NULL OR max_cpc_bid_inr_cents > 0),
  cpm_rate_inr_cents bigint CHECK (cpm_rate_inr_cents IS NULL OR cpm_rate_inr_cents > 0),
  sponsorship_daily_inr_cents bigint CHECK (sponsorship_daily_inr_cents IS NULL OR sponsorship_daily_inr_cents > 0),
  daily_budget_inr_cents bigint NOT NULL DEFAULT 0 CHECK (daily_budget_inr_cents >= 0),
  total_budget_inr_cents bigint CHECK (total_budget_inr_cents IS NULL OR total_budget_inr_cents >= 0),
  spent_inr_cents bigint NOT NULL DEFAULT 0 CHECK (spent_inr_cents >= 0),
  spent_today_inr_cents bigint NOT NULL DEFAULT 0 CHECK (spent_today_inr_cents >= 0),
  budget_day date NOT NULL DEFAULT (timezone('Asia/Kolkata', now()))::date,
  category_hint text,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  impressions_count bigint NOT NULL DEFAULT 0,
  clicks_count bigint NOT NULL DEFAULT 0,
  created_by_user_id uuid REFERENCES auth.users (id),
  created_by_staff_id uuid REFERENCES auth.users (id),
  on_behalf_of_supplier_id uuid REFERENCES public.suppliers (id),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_campaigns_supplier_idx ON public.ad_campaigns (supplier_id, status);
CREATE INDEX IF NOT EXISTS ad_campaigns_active_idx ON public.ad_campaigns (status) WHERE status = 'active';

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_campaigns_vendor_all ON public.ad_campaigns;
DROP POLICY IF EXISTS ad_campaigns_select ON public.ad_campaigns;
DROP POLICY IF EXISTS ad_campaigns_mutate ON public.ad_campaigns;

CREATE POLICY ad_campaigns_select ON public.ad_campaigns
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_campaigns.supplier_id AND s.owner_id = auth.uid())
    OR public.is_active_staff()
  );

CREATE POLICY ad_campaigns_mutate ON public.ad_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_campaigns.supplier_id AND s.owner_id = auth.uid())
    OR public.staff_has_min_role('manager')
  );

CREATE POLICY ad_campaigns_update ON public.ad_campaigns
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_campaigns.supplier_id AND s.owner_id = auth.uid())
    OR public.staff_has_min_role('manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_campaigns.supplier_id AND s.owner_id = auth.uid())
    OR public.staff_has_min_role('manager')
  );

CREATE POLICY ad_campaigns_delete ON public.ad_campaigns
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_campaigns.supplier_id AND s.owner_id = auth.uid())
    OR public.staff_has_min_role('manager')
  );

CREATE TABLE IF NOT EXISTS public.ad_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns (id) ON DELETE CASCADE,
  keyword text NOT NULL CHECK (char_length(trim(keyword)) >= 2),
  match_type text NOT NULL DEFAULT 'broad' CHECK (match_type IN ('broad', 'phrase', 'exact')),
  negative boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_keywords_campaign_idx ON public.ad_keywords (campaign_id);

ALTER TABLE public.ad_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_keywords_via_campaign ON public.ad_keywords;
DROP POLICY IF EXISTS ad_keywords_select ON public.ad_keywords;
DROP POLICY IF EXISTS ad_keywords_mutate ON public.ad_keywords;

CREATE POLICY ad_keywords_select ON public.ad_keywords
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_keywords.campaign_id AND (s.owner_id = auth.uid() OR public.is_active_staff())
    )
  );

CREATE POLICY ad_keywords_mutate ON public.ad_keywords
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_keywords.campaign_id AND (s.owner_id = auth.uid() OR public.staff_has_min_role('manager'))
    )
  );

CREATE POLICY ad_keywords_update ON public.ad_keywords
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_keywords.campaign_id AND (s.owner_id = auth.uid() OR public.staff_has_min_role('manager'))
    )
  );

CREATE POLICY ad_keywords_delete ON public.ad_keywords
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_keywords.campaign_id AND (s.owner_id = auth.uid() OR public.staff_has_min_role('manager'))
    )
  );

CREATE TABLE IF NOT EXISTS public.ad_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  creative_format text NOT NULL DEFAULT 'image'
    CHECK (creative_format IN ('text', 'image', 'video')),
  headline_override text,
  body_text text,
  media_url text,
  cta_label text NOT NULL DEFAULT 'Learn more',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_creatives_campaign_idx ON public.ad_creatives (campaign_id);

ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_creatives_via_campaign ON public.ad_creatives;
DROP POLICY IF EXISTS ad_creatives_select ON public.ad_creatives;
DROP POLICY IF EXISTS ad_creatives_mutate ON public.ad_creatives;

CREATE POLICY ad_creatives_select ON public.ad_creatives
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_creatives.campaign_id AND (s.owner_id = auth.uid() OR public.is_active_staff())
    )
  );

CREATE POLICY ad_creatives_mutate ON public.ad_creatives
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_creatives.campaign_id AND (s.owner_id = auth.uid() OR public.staff_has_min_role('manager'))
    )
  );

CREATE POLICY ad_creatives_update ON public.ad_creatives
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_creatives.campaign_id AND (s.owner_id = auth.uid() OR public.staff_has_min_role('manager'))
    )
  );

CREATE POLICY ad_creatives_delete ON public.ad_creatives
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_creatives.campaign_id AND (s.owner_id = auth.uid() OR public.staff_has_min_role('manager'))
    )
  );

CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid NOT NULL REFERENCES public.ad_creatives (id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns (id) ON DELETE CASCADE,
  placement text NOT NULL,
  search_query text,
  viewer_user_id uuid REFERENCES auth.users (id),
  cpm_charged_inr_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_impressions_campaign_idx ON public.ad_impressions (campaign_id, created_at DESC);

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_impressions_select ON public.ad_impressions;
CREATE POLICY ad_impressions_select ON public.ad_impressions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_impressions.campaign_id AND (s.owner_id = auth.uid() OR public.is_active_staff())
    )
  );

CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  impression_id uuid REFERENCES public.ad_impressions (id) ON DELETE SET NULL,
  creative_id uuid NOT NULL REFERENCES public.ad_creatives (id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns (id) ON DELETE CASCADE,
  cpc_charged_inr_cents bigint NOT NULL DEFAULT 0,
  wallet_transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_clicks_campaign_idx ON public.ad_clicks (campaign_id, created_at DESC);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_clicks_select ON public.ad_clicks;
CREATE POLICY ad_clicks_select ON public.ad_clicks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.suppliers s ON s.id = c.supplier_id
      WHERE c.id = ad_clicks.campaign_id AND (s.owner_id = auth.uid() OR public.is_active_staff())
    )
  );

-- FK backfill for wallet tx
ALTER TABLE public.ad_wallet_transactions
  DROP CONSTRAINT IF EXISTS ad_wallet_tx_campaign_fkey;
ALTER TABLE public.ad_wallet_transactions
  ADD CONSTRAINT ad_wallet_tx_campaign_fkey
  FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns (id) ON DELETE SET NULL;

ALTER TABLE public.ad_clicks
  DROP CONSTRAINT IF EXISTS ad_clicks_wallet_tx_fkey;
ALTER TABLE public.ad_clicks
  ADD CONSTRAINT ad_clicks_wallet_tx_fkey
  FOREIGN KEY (wallet_transaction_id) REFERENCES public.ad_wallet_transactions (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Ad invoices (fake GST-style — TEST MODE)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers (id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.ad_campaigns (id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  invoice_type public.ad_invoice_type NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  subtotal_inr numeric(14, 2) NOT NULL,
  total_inr numeric(14, 2) NOT NULL,
  line_summary text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  period_start date,
  period_end date,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'voided')),
  test_mode boolean NOT NULL DEFAULT true,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_invoices_supplier_idx ON public.ad_invoices (supplier_id, issued_at DESC);

ALTER TABLE public.ad_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_invoices_select ON public.ad_invoices;
CREATE POLICY ad_invoices_select ON public.ad_invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = ad_invoices.supplier_id AND s.owner_id = auth.uid())
    OR public.is_active_staff()
  );

ALTER TABLE public.ad_wallet_transactions
  DROP CONSTRAINT IF EXISTS ad_wallet_tx_invoice_fkey;
ALTER TABLE public.ad_wallet_transactions
  ADD CONSTRAINT ad_wallet_tx_invoice_fkey
  FOREIGN KEY (ad_invoice_id) REFERENCES public.ad_invoices (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_ad_invoice_number(p_prefix text DEFAULT 'SBJ-AD')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day text := to_char(timezone('Asia/Kolkata', now()), 'YYYYMMDD');
  v_seq int;
BEGIN
  SELECT count(*)::int + 1 INTO v_seq
  FROM public.ad_invoices
  WHERE invoice_number LIKE p_prefix || '-' || v_day || '-%';
  RETURN p_prefix || '-' || v_day || '-' || lpad(v_seq::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_ad_wallet(p_supplier_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ad_wallets (supplier_id) VALUES (p_supplier_id)
  ON CONFLICT (supplier_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.ad_campaign_reset_daily_spend(p_campaign_id uuid)
RETURNS public.ad_campaigns
LANGUAGE plpgsql
AS $$
DECLARE
  v_today date := (timezone('Asia/Kolkata', now()))::date;
  v_c public.ad_campaigns;
BEGIN
  SELECT * INTO v_c FROM public.ad_campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;
  IF v_c.budget_day IS DISTINCT FROM v_today THEN
    UPDATE public.ad_campaigns
    SET spent_today_inr_cents = 0, budget_day = v_today, updated_at = now()
    WHERE id = v_c.id
    RETURNING * INTO v_c;
  END IF;
  RETURN v_c;
END;
$$;

CREATE OR REPLACE FUNCTION public.ad_keyword_matches(p_keyword text, p_query text, p_match_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_query IS NULL OR trim(p_query) = '' THEN true
    WHEN p_match_type = 'exact' THEN lower(trim(p_query)) = lower(trim(p_keyword))
    WHEN p_match_type = 'phrase' THEN lower(p_query) LIKE '%' || lower(trim(p_keyword)) || '%'
    ELSE lower(p_query) LIKE '%' || lower(trim(p_keyword)) || '%'
  END;
$$;

CREATE OR REPLACE FUNCTION public.ad_debit_wallet(
  p_supplier_id uuid,
  p_amount_inr_cents bigint,
  p_tx_type public.ad_wallet_tx_type,
  p_campaign_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_staff_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.ad_wallets%ROWTYPE;
  v_tx_id uuid;
BEGIN
  IF p_amount_inr_cents <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount must be positive');
  END IF;

  PERFORM public.ensure_ad_wallet(p_supplier_id);

  SELECT * INTO v_wallet FROM public.ad_wallets WHERE supplier_id = p_supplier_id FOR UPDATE;
  IF v_wallet.balance_inr_cents < p_amount_inr_cents THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Insufficient ad wallet balance');
  END IF;

  UPDATE public.ad_wallets
  SET balance_inr_cents = balance_inr_cents - p_amount_inr_cents, updated_at = now()
  WHERE supplier_id = p_supplier_id
  RETURNING * INTO v_wallet;

  INSERT INTO public.ad_wallet_transactions (
    supplier_id, amount_inr_cents, tx_type, balance_after_inr_cents,
    campaign_id, note, created_by_user_id, created_by_staff_id
  ) VALUES (
    p_supplier_id, -p_amount_inr_cents, p_tx_type, v_wallet.balance_inr_cents,
    p_campaign_id, p_note, p_user_id, p_staff_id
  )
  RETURNING id INTO v_tx_id;

  IF p_campaign_id IS NOT NULL THEN
    UPDATE public.ad_campaigns
    SET spent_inr_cents = spent_inr_cents + p_amount_inr_cents,
        spent_today_inr_cents = spent_today_inr_cents + p_amount_inr_cents,
        updated_at = now()
    WHERE id = p_campaign_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'transaction_id', v_tx_id, 'balance_inr_cents', v_wallet.balance_inr_cents);
END;
$$;

CREATE OR REPLACE FUNCTION public.ad_credit_wallet(
  p_supplier_id uuid,
  p_amount_inr_cents bigint,
  p_tx_type public.ad_wallet_tx_type,
  p_note text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_staff_id uuid DEFAULT NULL,
  p_create_receipt boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.ad_wallets%ROWTYPE;
  v_tx_id uuid;
  v_inv_id uuid;
  v_inv_no text;
  v_amount_inr numeric(14, 2);
BEGIN
  IF p_amount_inr_cents <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount must be positive');
  END IF;

  PERFORM public.ensure_ad_wallet(p_supplier_id);
  v_amount_inr := round(p_amount_inr_cents / 100.0, 2);

  SELECT * INTO v_wallet FROM public.ad_wallets WHERE supplier_id = p_supplier_id FOR UPDATE;

  UPDATE public.ad_wallets
  SET balance_inr_cents = balance_inr_cents + p_amount_inr_cents, updated_at = now()
  WHERE supplier_id = p_supplier_id
  RETURNING * INTO v_wallet;

  IF p_create_receipt THEN
    v_inv_no := public.next_ad_invoice_number('SBJ-AD-RCP');
    INSERT INTO public.ad_invoices (
      supplier_id, invoice_number, invoice_type, subtotal_inr, total_inr,
      line_summary, line_items, test_mode
    ) VALUES (
      p_supplier_id, v_inv_no, 'wallet_receipt', v_amount_inr, v_amount_inr,
      'TEST MODE — ad wallet top-up (simulated)',
      jsonb_build_array(jsonb_build_object('description', coalesce(p_note, 'Ad wallet credit'), 'amount_inr', v_amount_inr)),
      true
    )
    RETURNING id INTO v_inv_id;
  END IF;

  INSERT INTO public.ad_wallet_transactions (
    supplier_id, amount_inr_cents, tx_type, balance_after_inr_cents,
    ad_invoice_id, note, created_by_user_id, created_by_staff_id
  ) VALUES (
    p_supplier_id, p_amount_inr_cents, p_tx_type, v_wallet.balance_inr_cents,
    v_inv_id, p_note, p_user_id, p_staff_id
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'ok', true,
    'transaction_id', v_tx_id,
    'invoice_id', v_inv_id,
    'balance_inr_cents', v_wallet.balance_inr_cents
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fake_top_up_ad_wallet(p_amount_inr_cents bigint DEFAULT 50000)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_supplier_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  SELECT id INTO v_supplier_id FROM public.suppliers WHERE owner_id = v_uid LIMIT 1;
  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Seller company required');
  END IF;

  RETURN public.ad_credit_wallet(
    v_supplier_id, p_amount_inr_cents, 'top_up',
    'TEST MODE — seller test credit', v_uid, NULL, true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ops_grant_ad_credit(
  p_supplier_id uuid,
  p_amount_inr_cents bigint,
  p_note text DEFAULT 'Ops promotional ad credit'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF NOT public.staff_has_min_role('manager') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Manager+ required');
  END IF;

  v_result := public.ad_credit_wallet(
    p_supplier_id, p_amount_inr_cents, 'ops_credit', p_note, NULL, v_uid, true
  );

  IF (v_result->>'ok')::boolean THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      v_uid, 'ad_wallet.credit', 'supplier', p_supplier_id,
      jsonb_build_object('amount_inr_cents', p_amount_inr_cents, 'note', p_note)
    );
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sponsored_placements(
  p_placement text,
  p_query text DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_limit int DEFAULT 3
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows jsonb := '[]'::jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.bid_score DESC), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT
      cr.id AS creative_id,
      cr.campaign_id,
      cr.product_id,
      cr.creative_format,
      cr.headline_override,
      cr.body_text,
      cr.media_url,
      cr.cta_label,
      c.supplier_id,
      c.billing_model,
      c.max_cpc_bid_inr_cents,
      c.cpm_rate_inr_cents,
      coalesce(c.max_cpc_bid_inr_cents, c.cpm_rate_inr_cents, c.sponsorship_daily_inr_cents, 0) AS bid_score,
      coalesce(nullif(trim(cr.headline_override), ''), p.title, nullif(trim(cr.body_text), ''), 'Sponsored listing') AS product_title,
      coalesce(p.price, 0) AS product_price,
      coalesce(p.currency, 'INR') AS product_currency,
      coalesce(nullif(trim(cr.media_url), ''), p.image_url, '') AS product_image_url,
      s.name AS supplier_name,
      s.slug AS supplier_slug,
      coalesce(p.slug, s.slug) AS product_slug
    FROM public.ad_campaigns c
    JOIN public.ad_creatives cr ON cr.campaign_id = c.id
    LEFT JOIN public.products p ON p.id = cr.product_id AND p.status = 'published'
    JOIN public.suppliers s ON s.id = c.supplier_id
    JOIN public.ad_wallets w ON w.supplier_id = c.supplier_id
    WHERE c.status = 'active'
      AND p_placement = ANY (c.placement_types)
      AND w.balance_inr_cents > 0
      AND (c.end_at IS NULL OR c.end_at > now())
      AND c.start_at <= now()
      AND (
        cr.product_id IS NOT NULL
        OR nullif(trim(coalesce(cr.headline_override, cr.body_text, '')), '') IS NOT NULL
      )
      AND (
        c.daily_budget_inr_cents = 0
        OR (
          CASE
            WHEN c.budget_day IS DISTINCT FROM (timezone('Asia/Kolkata', now()))::date THEN 0
            ELSE c.spent_today_inr_cents
          END
        ) < c.daily_budget_inr_cents
      )
      AND (c.total_budget_inr_cents IS NULL OR c.spent_inr_cents < c.total_budget_inr_cents)
      AND (
        c.billing_model <> 'cpc'
        OR NOT EXISTS (
          SELECT 1 FROM public.ad_keywords k
          WHERE k.campaign_id = c.id AND k.negative = false
        )
        OR EXISTS (
          SELECT 1 FROM public.ad_keywords k
          WHERE k.campaign_id = c.id
            AND k.negative = false
            AND public.ad_keyword_matches(k.keyword, coalesce(p_query, ''), k.match_type)
        )
      )
      AND (
        c.category_hint IS NULL
        OR p_category_slug IS NULL
        OR c.category_hint = p_category_slug
      )
    ORDER BY bid_score DESC
    LIMIT greatest(1, least(p_limit, 10))
  ) t;

  RETURN jsonb_build_object('ok', true, 'placements', v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_ad_impression(
  p_creative_id uuid,
  p_placement text,
  p_search_query text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c public.ad_campaigns%ROWTYPE;
  v_imp_id uuid;
  v_charge bigint := 0;
  v_debit jsonb;
BEGIN
  SELECT c.* INTO v_c
  FROM public.ad_creatives cr
  JOIN public.ad_campaigns c ON c.id = cr.campaign_id
  WHERE cr.id = p_creative_id AND c.status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Creative not found or inactive');
  END IF;

  SELECT * INTO v_c FROM public.ad_campaign_reset_daily_spend(v_c.id);

  IF v_c.billing_model IN ('cpm', 'sponsorship') THEN
    IF v_c.billing_model = 'cpm' THEN
      v_charge := greatest(coalesce(v_c.cpm_rate_inr_cents, 100), 1);
    ELSE
      v_charge := greatest(coalesce(v_c.sponsorship_daily_inr_cents, 1000) / 100, 1);
    END IF;
    v_debit := public.ad_debit_wallet(
      v_c.supplier_id, v_charge,
      CASE WHEN v_c.billing_model = 'cpm' THEN 'cpm_charge'::public.ad_wallet_tx_type ELSE 'sponsorship_charge'::public.ad_wallet_tx_type END,
      v_c.id, 'Impression on ' || p_placement, auth.uid(), NULL
    );
    IF NOT (v_debit->>'ok')::boolean THEN
      UPDATE public.ad_campaigns SET status = 'paused', updated_at = now() WHERE id = v_c.id;
      RETURN v_debit;
    END IF;
  END IF;

  INSERT INTO public.ad_impressions (creative_id, campaign_id, placement, search_query, viewer_user_id, cpm_charged_inr_cents)
  VALUES (p_creative_id, v_c.id, p_placement, p_search_query, auth.uid(), v_charge)
  RETURNING id INTO v_imp_id;

  UPDATE public.ad_campaigns
  SET impressions_count = impressions_count + 1, updated_at = now()
  WHERE id = v_c.id;

  RETURN jsonb_build_object('ok', true, 'impression_id', v_imp_id, 'charged_inr_cents', v_charge);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_ad_click(
  p_creative_id uuid,
  p_impression_id uuid DEFAULT NULL,
  p_placement text DEFAULT 'search_results_top'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c public.ad_campaigns%ROWTYPE;
  v_imp_id uuid := p_impression_id;
  v_charge bigint := 0;
  v_debit jsonb;
  v_tx_id uuid;
  v_click_id uuid;
BEGIN
  SELECT c.* INTO v_c
  FROM public.ad_creatives cr
  JOIN public.ad_campaigns c ON c.id = cr.campaign_id
  WHERE cr.id = p_creative_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Creative not found');
  END IF;

  SELECT * INTO v_c FROM public.ad_campaign_reset_daily_spend(v_c.id);

  IF v_imp_id IS NULL THEN
    INSERT INTO public.ad_impressions (creative_id, campaign_id, placement, viewer_user_id)
    VALUES (p_creative_id, v_c.id, p_placement, auth.uid())
    RETURNING id INTO v_imp_id;
  END IF;

  IF v_c.billing_model = 'cpc' THEN
    v_charge := greatest(coalesce(v_c.max_cpc_bid_inr_cents, 500), 1);
    v_debit := public.ad_debit_wallet(
      v_c.supplier_id, v_charge, 'cpc_charge', v_c.id,
      'CPC click', auth.uid(), NULL
    );
    IF NOT (v_debit->>'ok')::boolean THEN
      UPDATE public.ad_campaigns SET status = 'paused', updated_at = now() WHERE id = v_c.id;
      RETURN v_debit;
    END IF;
    v_tx_id := (v_debit->>'transaction_id')::uuid;
  END IF;

  INSERT INTO public.ad_clicks (impression_id, creative_id, campaign_id, cpc_charged_inr_cents, wallet_transaction_id)
  VALUES (v_imp_id, p_creative_id, v_c.id, v_charge, v_tx_id)
  RETURNING id INTO v_click_id;

  UPDATE public.ad_campaigns
  SET clicks_count = clicks_count + 1, updated_at = now()
  WHERE id = v_c.id;

  RETURN jsonb_build_object('ok', true, 'click_id', v_click_id, 'charged_inr_cents', v_charge);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fake_top_up_ad_wallet(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ops_grant_ad_credit(uuid, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sponsored_placements(text, text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ad_impression(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ad_click(uuid, uuid, text) TO anon, authenticated;
