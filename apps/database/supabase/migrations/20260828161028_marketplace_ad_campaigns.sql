create type "public"."ad_billing_model" as enum ('cpc', 'cpm', 'sponsorship');

create type "public"."ad_campaign_status" as enum ('draft', 'active', 'paused', 'ended', 'rejected');

create type "public"."ad_invoice_type" as enum ('wallet_receipt', 'spend_statement', 'service_invoice', 'credit_note');

create type "public"."ad_wallet_tx_type" as enum ('top_up', 'cpc_charge', 'cpm_charge', 'sponsorship_charge', 'ops_credit', 'refund');

alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";


  create table "public"."ad_campaigns" (
    "id" uuid not null default gen_random_uuid(),
    "supplier_id" uuid not null,
    "name" text not null,
    "status" public.ad_campaign_status not null default 'draft'::public.ad_campaign_status,
    "billing_model" public.ad_billing_model not null default 'cpc'::public.ad_billing_model,
    "placement_types" text[] not null default '{search_results_top}'::text[],
    "max_cpc_bid_inr_cents" bigint,
    "cpm_rate_inr_cents" bigint,
    "sponsorship_daily_inr_cents" bigint,
    "daily_budget_inr_cents" bigint not null default 0,
    "total_budget_inr_cents" bigint,
    "spent_inr_cents" bigint not null default 0,
    "spent_today_inr_cents" bigint not null default 0,
    "budget_day" date not null default (timezone('Asia/Kolkata'::text, now()))::date,
    "category_hint" text,
    "start_at" timestamp with time zone not null default now(),
    "end_at" timestamp with time zone,
    "impressions_count" bigint not null default 0,
    "clicks_count" bigint not null default 0,
    "created_by_user_id" uuid,
    "created_by_staff_id" uuid,
    "on_behalf_of_supplier_id" uuid,
    "rejection_reason" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_campaigns" enable row level security;


  create table "public"."ad_clicks" (
    "id" uuid not null default gen_random_uuid(),
    "impression_id" uuid,
    "creative_id" uuid not null,
    "campaign_id" uuid not null,
    "cpc_charged_inr_cents" bigint not null default 0,
    "wallet_transaction_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_clicks" enable row level security;


  create table "public"."ad_creatives" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_id" uuid not null,
    "product_id" uuid,
    "headline_override" text,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_creatives" enable row level security;


  create table "public"."ad_impressions" (
    "id" uuid not null default gen_random_uuid(),
    "creative_id" uuid not null,
    "campaign_id" uuid not null,
    "placement" text not null,
    "search_query" text,
    "viewer_user_id" uuid,
    "cpm_charged_inr_cents" bigint not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_impressions" enable row level security;


  create table "public"."ad_invoices" (
    "id" uuid not null default gen_random_uuid(),
    "supplier_id" uuid not null,
    "campaign_id" uuid,
    "invoice_number" text not null,
    "invoice_type" public.ad_invoice_type not null,
    "currency" text not null default 'INR'::text,
    "subtotal_inr" numeric(14,2) not null,
    "total_inr" numeric(14,2) not null,
    "line_summary" text,
    "line_items" jsonb not null default '[]'::jsonb,
    "period_start" date,
    "period_end" date,
    "status" text not null default 'issued'::text,
    "test_mode" boolean not null default true,
    "issued_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_invoices" enable row level security;


  create table "public"."ad_keywords" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_id" uuid not null,
    "keyword" text not null,
    "match_type" text not null default 'broad'::text,
    "negative" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_keywords" enable row level security;


  create table "public"."ad_wallet_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "supplier_id" uuid not null,
    "amount_inr_cents" bigint not null,
    "tx_type" public.ad_wallet_tx_type not null,
    "balance_after_inr_cents" bigint not null,
    "campaign_id" uuid,
    "ad_click_id" uuid,
    "ad_impression_id" uuid,
    "ad_invoice_id" uuid,
    "note" text,
    "created_by_user_id" uuid,
    "created_by_staff_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_wallet_transactions" enable row level security;


  create table "public"."ad_wallets" (
    "supplier_id" uuid not null,
    "balance_inr_cents" bigint not null default 0,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."ad_wallets" enable row level security;

CREATE INDEX ad_campaigns_active_idx ON public.ad_campaigns USING btree (status) WHERE (status = 'active'::public.ad_campaign_status);

CREATE UNIQUE INDEX ad_campaigns_pkey ON public.ad_campaigns USING btree (id);

CREATE INDEX ad_campaigns_supplier_idx ON public.ad_campaigns USING btree (supplier_id, status);

CREATE INDEX ad_clicks_campaign_idx ON public.ad_clicks USING btree (campaign_id, created_at DESC);

CREATE UNIQUE INDEX ad_clicks_pkey ON public.ad_clicks USING btree (id);

CREATE INDEX ad_creatives_campaign_idx ON public.ad_creatives USING btree (campaign_id);

CREATE UNIQUE INDEX ad_creatives_pkey ON public.ad_creatives USING btree (id);

CREATE INDEX ad_impressions_campaign_idx ON public.ad_impressions USING btree (campaign_id, created_at DESC);

CREATE UNIQUE INDEX ad_impressions_pkey ON public.ad_impressions USING btree (id);

CREATE UNIQUE INDEX ad_invoices_invoice_number_key ON public.ad_invoices USING btree (invoice_number);

CREATE UNIQUE INDEX ad_invoices_pkey ON public.ad_invoices USING btree (id);

CREATE INDEX ad_invoices_supplier_idx ON public.ad_invoices USING btree (supplier_id, issued_at DESC);

CREATE INDEX ad_keywords_campaign_idx ON public.ad_keywords USING btree (campaign_id);

CREATE UNIQUE INDEX ad_keywords_pkey ON public.ad_keywords USING btree (id);

CREATE UNIQUE INDEX ad_wallet_transactions_pkey ON public.ad_wallet_transactions USING btree (id);

CREATE INDEX ad_wallet_tx_supplier_idx ON public.ad_wallet_transactions USING btree (supplier_id, created_at DESC);

CREATE UNIQUE INDEX ad_wallets_pkey ON public.ad_wallets USING btree (supplier_id);

alter table "public"."ad_campaigns" add constraint "ad_campaigns_pkey" PRIMARY KEY using index "ad_campaigns_pkey";

alter table "public"."ad_clicks" add constraint "ad_clicks_pkey" PRIMARY KEY using index "ad_clicks_pkey";

alter table "public"."ad_creatives" add constraint "ad_creatives_pkey" PRIMARY KEY using index "ad_creatives_pkey";

alter table "public"."ad_impressions" add constraint "ad_impressions_pkey" PRIMARY KEY using index "ad_impressions_pkey";

alter table "public"."ad_invoices" add constraint "ad_invoices_pkey" PRIMARY KEY using index "ad_invoices_pkey";

alter table "public"."ad_keywords" add constraint "ad_keywords_pkey" PRIMARY KEY using index "ad_keywords_pkey";

alter table "public"."ad_wallet_transactions" add constraint "ad_wallet_transactions_pkey" PRIMARY KEY using index "ad_wallet_transactions_pkey";

alter table "public"."ad_wallets" add constraint "ad_wallets_pkey" PRIMARY KEY using index "ad_wallets_pkey";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_cpm_rate_inr_cents_check" CHECK (((cpm_rate_inr_cents IS NULL) OR (cpm_rate_inr_cents > 0))) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_cpm_rate_inr_cents_check";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_created_by_staff_id_fkey" FOREIGN KEY (created_by_staff_id) REFERENCES auth.users(id) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_created_by_staff_id_fkey";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_created_by_user_id_fkey" FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_created_by_user_id_fkey";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_daily_budget_inr_cents_check" CHECK ((daily_budget_inr_cents >= 0)) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_daily_budget_inr_cents_check";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_max_cpc_bid_inr_cents_check" CHECK (((max_cpc_bid_inr_cents IS NULL) OR (max_cpc_bid_inr_cents > 0))) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_max_cpc_bid_inr_cents_check";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_name_check" CHECK ((char_length(TRIM(BOTH FROM name)) >= 2)) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_name_check";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_on_behalf_of_supplier_id_fkey" FOREIGN KEY (on_behalf_of_supplier_id) REFERENCES public.suppliers(id) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_on_behalf_of_supplier_id_fkey";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_spent_inr_cents_check" CHECK ((spent_inr_cents >= 0)) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_spent_inr_cents_check";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_spent_today_inr_cents_check" CHECK ((spent_today_inr_cents >= 0)) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_spent_today_inr_cents_check";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_sponsorship_daily_inr_cents_check" CHECK (((sponsorship_daily_inr_cents IS NULL) OR (sponsorship_daily_inr_cents > 0))) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_sponsorship_daily_inr_cents_check";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_supplier_id_fkey";

alter table "public"."ad_campaigns" add constraint "ad_campaigns_total_budget_inr_cents_check" CHECK (((total_budget_inr_cents IS NULL) OR (total_budget_inr_cents >= 0))) not valid;

alter table "public"."ad_campaigns" validate constraint "ad_campaigns_total_budget_inr_cents_check";

alter table "public"."ad_clicks" add constraint "ad_clicks_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."ad_clicks" validate constraint "ad_clicks_campaign_id_fkey";

alter table "public"."ad_clicks" add constraint "ad_clicks_creative_id_fkey" FOREIGN KEY (creative_id) REFERENCES public.ad_creatives(id) ON DELETE CASCADE not valid;

alter table "public"."ad_clicks" validate constraint "ad_clicks_creative_id_fkey";

alter table "public"."ad_clicks" add constraint "ad_clicks_impression_id_fkey" FOREIGN KEY (impression_id) REFERENCES public.ad_impressions(id) ON DELETE SET NULL not valid;

alter table "public"."ad_clicks" validate constraint "ad_clicks_impression_id_fkey";

alter table "public"."ad_clicks" add constraint "ad_clicks_wallet_tx_fkey" FOREIGN KEY (wallet_transaction_id) REFERENCES public.ad_wallet_transactions(id) ON DELETE SET NULL not valid;

alter table "public"."ad_clicks" validate constraint "ad_clicks_wallet_tx_fkey";

alter table "public"."ad_creatives" add constraint "ad_creatives_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."ad_creatives" validate constraint "ad_creatives_campaign_id_fkey";

alter table "public"."ad_creatives" add constraint "ad_creatives_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."ad_creatives" validate constraint "ad_creatives_product_id_fkey";

alter table "public"."ad_impressions" add constraint "ad_impressions_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."ad_impressions" validate constraint "ad_impressions_campaign_id_fkey";

alter table "public"."ad_impressions" add constraint "ad_impressions_creative_id_fkey" FOREIGN KEY (creative_id) REFERENCES public.ad_creatives(id) ON DELETE CASCADE not valid;

alter table "public"."ad_impressions" validate constraint "ad_impressions_creative_id_fkey";

alter table "public"."ad_impressions" add constraint "ad_impressions_viewer_user_id_fkey" FOREIGN KEY (viewer_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ad_impressions" validate constraint "ad_impressions_viewer_user_id_fkey";

alter table "public"."ad_invoices" add constraint "ad_invoices_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL not valid;

alter table "public"."ad_invoices" validate constraint "ad_invoices_campaign_id_fkey";

alter table "public"."ad_invoices" add constraint "ad_invoices_invoice_number_key" UNIQUE using index "ad_invoices_invoice_number_key";

alter table "public"."ad_invoices" add constraint "ad_invoices_status_check" CHECK ((status = ANY (ARRAY['issued'::text, 'voided'::text]))) not valid;

alter table "public"."ad_invoices" validate constraint "ad_invoices_status_check";

alter table "public"."ad_invoices" add constraint "ad_invoices_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."ad_invoices" validate constraint "ad_invoices_supplier_id_fkey";

alter table "public"."ad_keywords" add constraint "ad_keywords_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."ad_keywords" validate constraint "ad_keywords_campaign_id_fkey";

alter table "public"."ad_keywords" add constraint "ad_keywords_keyword_check" CHECK ((char_length(TRIM(BOTH FROM keyword)) >= 2)) not valid;

alter table "public"."ad_keywords" validate constraint "ad_keywords_keyword_check";

alter table "public"."ad_keywords" add constraint "ad_keywords_match_type_check" CHECK ((match_type = ANY (ARRAY['broad'::text, 'phrase'::text, 'exact'::text]))) not valid;

alter table "public"."ad_keywords" validate constraint "ad_keywords_match_type_check";

alter table "public"."ad_wallet_transactions" add constraint "ad_wallet_transactions_created_by_staff_id_fkey" FOREIGN KEY (created_by_staff_id) REFERENCES auth.users(id) not valid;

alter table "public"."ad_wallet_transactions" validate constraint "ad_wallet_transactions_created_by_staff_id_fkey";

alter table "public"."ad_wallet_transactions" add constraint "ad_wallet_transactions_created_by_user_id_fkey" FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ad_wallet_transactions" validate constraint "ad_wallet_transactions_created_by_user_id_fkey";

alter table "public"."ad_wallet_transactions" add constraint "ad_wallet_transactions_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."ad_wallet_transactions" validate constraint "ad_wallet_transactions_supplier_id_fkey";

alter table "public"."ad_wallet_transactions" add constraint "ad_wallet_tx_campaign_fkey" FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL not valid;

alter table "public"."ad_wallet_transactions" validate constraint "ad_wallet_tx_campaign_fkey";

alter table "public"."ad_wallet_transactions" add constraint "ad_wallet_tx_invoice_fkey" FOREIGN KEY (ad_invoice_id) REFERENCES public.ad_invoices(id) ON DELETE SET NULL not valid;

alter table "public"."ad_wallet_transactions" validate constraint "ad_wallet_tx_invoice_fkey";

alter table "public"."ad_wallets" add constraint "ad_wallets_balance_inr_cents_check" CHECK ((balance_inr_cents >= 0)) not valid;

alter table "public"."ad_wallets" validate constraint "ad_wallets_balance_inr_cents_check";

alter table "public"."ad_wallets" add constraint "ad_wallets_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."ad_wallets" validate constraint "ad_wallets_supplier_id_fkey";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.ad_campaign_reset_daily_spend(p_campaign_id uuid)
 RETURNS public.ad_campaigns
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.ad_credit_wallet(p_supplier_id uuid, p_amount_inr_cents bigint, p_tx_type public.ad_wallet_tx_type, p_note text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_staff_id uuid DEFAULT NULL::uuid, p_create_receipt boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.ad_debit_wallet(p_supplier_id uuid, p_amount_inr_cents bigint, p_tx_type public.ad_wallet_tx_type, p_campaign_id uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_staff_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.ad_keyword_matches(p_keyword text, p_query text, p_match_type text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_query IS NULL OR trim(p_query) = '' THEN true
    WHEN p_match_type = 'exact' THEN lower(trim(p_query)) = lower(trim(p_keyword))
    WHEN p_match_type = 'phrase' THEN lower(p_query) LIKE '%' || lower(trim(p_keyword)) || '%'
    ELSE lower(p_query) LIKE '%' || lower(trim(p_keyword)) || '%'
  END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_ad_wallet(p_supplier_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.ad_wallets (supplier_id) VALUES (p_supplier_id)
  ON CONFLICT (supplier_id) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fake_top_up_ad_wallet(p_amount_inr_cents bigint DEFAULT 50000)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_sponsored_placements(p_placement text, p_query text DEFAULT NULL::text, p_category_slug text DEFAULT NULL::text, p_limit integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      cr.headline_override,
      c.supplier_id,
      c.billing_model,
      c.max_cpc_bid_inr_cents,
      c.cpm_rate_inr_cents,
      coalesce(c.max_cpc_bid_inr_cents, c.cpm_rate_inr_cents, c.sponsorship_daily_inr_cents, 0) AS bid_score,
      p.title AS product_title,
      p.price AS product_price,
      p.currency AS product_currency,
      p.image_url AS product_image_url,
      s.name AS supplier_name,
      s.slug AS supplier_slug
    FROM public.ad_campaigns c
    JOIN public.ad_creatives cr ON cr.campaign_id = c.id
    JOIN public.products p ON p.id = cr.product_id AND p.status = 'published'
    JOIN public.suppliers s ON s.id = c.supplier_id
    JOIN public.ad_wallets w ON w.supplier_id = c.supplier_id
    WHERE c.status = 'active'
      AND p_placement = ANY (c.placement_types)
      AND w.balance_inr_cents > 0
      AND (c.end_at IS NULL OR c.end_at > now())
      AND c.start_at <= now()
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
$function$
;

CREATE OR REPLACE FUNCTION public.next_ad_invoice_number(p_prefix text DEFAULT 'SBJ-AD'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_day text := to_char(timezone('Asia/Kolkata', now()), 'YYYYMMDD');
  v_seq int;
BEGIN
  SELECT count(*)::int + 1 INTO v_seq
  FROM public.ad_invoices
  WHERE invoice_number LIKE p_prefix || '-' || v_day || '-%';
  RETURN p_prefix || '-' || v_day || '-' || lpad(v_seq::text, 4, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ops_grant_ad_credit(p_supplier_id uuid, p_amount_inr_cents bigint, p_note text DEFAULT 'Ops promotional ad credit'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_ad_click(p_creative_id uuid, p_impression_id uuid DEFAULT NULL::uuid, p_placement text DEFAULT 'search_results_top'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_ad_impression(p_creative_id uuid, p_placement text, p_search_query text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

grant delete on table "public"."ad_campaigns" to "anon";

grant insert on table "public"."ad_campaigns" to "anon";

grant references on table "public"."ad_campaigns" to "anon";

grant select on table "public"."ad_campaigns" to "anon";

grant trigger on table "public"."ad_campaigns" to "anon";

grant truncate on table "public"."ad_campaigns" to "anon";

grant update on table "public"."ad_campaigns" to "anon";

grant delete on table "public"."ad_campaigns" to "authenticated";

grant insert on table "public"."ad_campaigns" to "authenticated";

grant references on table "public"."ad_campaigns" to "authenticated";

grant select on table "public"."ad_campaigns" to "authenticated";

grant trigger on table "public"."ad_campaigns" to "authenticated";

grant truncate on table "public"."ad_campaigns" to "authenticated";

grant update on table "public"."ad_campaigns" to "authenticated";

grant delete on table "public"."ad_campaigns" to "service_role";

grant insert on table "public"."ad_campaigns" to "service_role";

grant references on table "public"."ad_campaigns" to "service_role";

grant select on table "public"."ad_campaigns" to "service_role";

grant trigger on table "public"."ad_campaigns" to "service_role";

grant truncate on table "public"."ad_campaigns" to "service_role";

grant update on table "public"."ad_campaigns" to "service_role";

grant delete on table "public"."ad_clicks" to "anon";

grant insert on table "public"."ad_clicks" to "anon";

grant references on table "public"."ad_clicks" to "anon";

grant select on table "public"."ad_clicks" to "anon";

grant trigger on table "public"."ad_clicks" to "anon";

grant truncate on table "public"."ad_clicks" to "anon";

grant update on table "public"."ad_clicks" to "anon";

grant delete on table "public"."ad_clicks" to "authenticated";

grant insert on table "public"."ad_clicks" to "authenticated";

grant references on table "public"."ad_clicks" to "authenticated";

grant select on table "public"."ad_clicks" to "authenticated";

grant trigger on table "public"."ad_clicks" to "authenticated";

grant truncate on table "public"."ad_clicks" to "authenticated";

grant update on table "public"."ad_clicks" to "authenticated";

grant delete on table "public"."ad_clicks" to "service_role";

grant insert on table "public"."ad_clicks" to "service_role";

grant references on table "public"."ad_clicks" to "service_role";

grant select on table "public"."ad_clicks" to "service_role";

grant trigger on table "public"."ad_clicks" to "service_role";

grant truncate on table "public"."ad_clicks" to "service_role";

grant update on table "public"."ad_clicks" to "service_role";

grant delete on table "public"."ad_creatives" to "anon";

grant insert on table "public"."ad_creatives" to "anon";

grant references on table "public"."ad_creatives" to "anon";

grant select on table "public"."ad_creatives" to "anon";

grant trigger on table "public"."ad_creatives" to "anon";

grant truncate on table "public"."ad_creatives" to "anon";

grant update on table "public"."ad_creatives" to "anon";

grant delete on table "public"."ad_creatives" to "authenticated";

grant insert on table "public"."ad_creatives" to "authenticated";

grant references on table "public"."ad_creatives" to "authenticated";

grant select on table "public"."ad_creatives" to "authenticated";

grant trigger on table "public"."ad_creatives" to "authenticated";

grant truncate on table "public"."ad_creatives" to "authenticated";

grant update on table "public"."ad_creatives" to "authenticated";

grant delete on table "public"."ad_creatives" to "service_role";

grant insert on table "public"."ad_creatives" to "service_role";

grant references on table "public"."ad_creatives" to "service_role";

grant select on table "public"."ad_creatives" to "service_role";

grant trigger on table "public"."ad_creatives" to "service_role";

grant truncate on table "public"."ad_creatives" to "service_role";

grant update on table "public"."ad_creatives" to "service_role";

grant delete on table "public"."ad_impressions" to "anon";

grant insert on table "public"."ad_impressions" to "anon";

grant references on table "public"."ad_impressions" to "anon";

grant select on table "public"."ad_impressions" to "anon";

grant trigger on table "public"."ad_impressions" to "anon";

grant truncate on table "public"."ad_impressions" to "anon";

grant update on table "public"."ad_impressions" to "anon";

grant delete on table "public"."ad_impressions" to "authenticated";

grant insert on table "public"."ad_impressions" to "authenticated";

grant references on table "public"."ad_impressions" to "authenticated";

grant select on table "public"."ad_impressions" to "authenticated";

grant trigger on table "public"."ad_impressions" to "authenticated";

grant truncate on table "public"."ad_impressions" to "authenticated";

grant update on table "public"."ad_impressions" to "authenticated";

grant delete on table "public"."ad_impressions" to "service_role";

grant insert on table "public"."ad_impressions" to "service_role";

grant references on table "public"."ad_impressions" to "service_role";

grant select on table "public"."ad_impressions" to "service_role";

grant trigger on table "public"."ad_impressions" to "service_role";

grant truncate on table "public"."ad_impressions" to "service_role";

grant update on table "public"."ad_impressions" to "service_role";

grant delete on table "public"."ad_invoices" to "anon";

grant insert on table "public"."ad_invoices" to "anon";

grant references on table "public"."ad_invoices" to "anon";

grant select on table "public"."ad_invoices" to "anon";

grant trigger on table "public"."ad_invoices" to "anon";

grant truncate on table "public"."ad_invoices" to "anon";

grant update on table "public"."ad_invoices" to "anon";

grant delete on table "public"."ad_invoices" to "authenticated";

grant insert on table "public"."ad_invoices" to "authenticated";

grant references on table "public"."ad_invoices" to "authenticated";

grant select on table "public"."ad_invoices" to "authenticated";

grant trigger on table "public"."ad_invoices" to "authenticated";

grant truncate on table "public"."ad_invoices" to "authenticated";

grant update on table "public"."ad_invoices" to "authenticated";

grant delete on table "public"."ad_invoices" to "service_role";

grant insert on table "public"."ad_invoices" to "service_role";

grant references on table "public"."ad_invoices" to "service_role";

grant select on table "public"."ad_invoices" to "service_role";

grant trigger on table "public"."ad_invoices" to "service_role";

grant truncate on table "public"."ad_invoices" to "service_role";

grant update on table "public"."ad_invoices" to "service_role";

grant delete on table "public"."ad_keywords" to "anon";

grant insert on table "public"."ad_keywords" to "anon";

grant references on table "public"."ad_keywords" to "anon";

grant select on table "public"."ad_keywords" to "anon";

grant trigger on table "public"."ad_keywords" to "anon";

grant truncate on table "public"."ad_keywords" to "anon";

grant update on table "public"."ad_keywords" to "anon";

grant delete on table "public"."ad_keywords" to "authenticated";

grant insert on table "public"."ad_keywords" to "authenticated";

grant references on table "public"."ad_keywords" to "authenticated";

grant select on table "public"."ad_keywords" to "authenticated";

grant trigger on table "public"."ad_keywords" to "authenticated";

grant truncate on table "public"."ad_keywords" to "authenticated";

grant update on table "public"."ad_keywords" to "authenticated";

grant delete on table "public"."ad_keywords" to "service_role";

grant insert on table "public"."ad_keywords" to "service_role";

grant references on table "public"."ad_keywords" to "service_role";

grant select on table "public"."ad_keywords" to "service_role";

grant trigger on table "public"."ad_keywords" to "service_role";

grant truncate on table "public"."ad_keywords" to "service_role";

grant update on table "public"."ad_keywords" to "service_role";

grant delete on table "public"."ad_wallet_transactions" to "anon";

grant insert on table "public"."ad_wallet_transactions" to "anon";

grant references on table "public"."ad_wallet_transactions" to "anon";

grant select on table "public"."ad_wallet_transactions" to "anon";

grant trigger on table "public"."ad_wallet_transactions" to "anon";

grant truncate on table "public"."ad_wallet_transactions" to "anon";

grant update on table "public"."ad_wallet_transactions" to "anon";

grant delete on table "public"."ad_wallet_transactions" to "authenticated";

grant insert on table "public"."ad_wallet_transactions" to "authenticated";

grant references on table "public"."ad_wallet_transactions" to "authenticated";

grant select on table "public"."ad_wallet_transactions" to "authenticated";

grant trigger on table "public"."ad_wallet_transactions" to "authenticated";

grant truncate on table "public"."ad_wallet_transactions" to "authenticated";

grant update on table "public"."ad_wallet_transactions" to "authenticated";

grant delete on table "public"."ad_wallet_transactions" to "service_role";

grant insert on table "public"."ad_wallet_transactions" to "service_role";

grant references on table "public"."ad_wallet_transactions" to "service_role";

grant select on table "public"."ad_wallet_transactions" to "service_role";

grant trigger on table "public"."ad_wallet_transactions" to "service_role";

grant truncate on table "public"."ad_wallet_transactions" to "service_role";

grant update on table "public"."ad_wallet_transactions" to "service_role";

grant delete on table "public"."ad_wallets" to "anon";

grant insert on table "public"."ad_wallets" to "anon";

grant references on table "public"."ad_wallets" to "anon";

grant select on table "public"."ad_wallets" to "anon";

grant trigger on table "public"."ad_wallets" to "anon";

grant truncate on table "public"."ad_wallets" to "anon";

grant update on table "public"."ad_wallets" to "anon";

grant delete on table "public"."ad_wallets" to "authenticated";

grant insert on table "public"."ad_wallets" to "authenticated";

grant references on table "public"."ad_wallets" to "authenticated";

grant select on table "public"."ad_wallets" to "authenticated";

grant trigger on table "public"."ad_wallets" to "authenticated";

grant truncate on table "public"."ad_wallets" to "authenticated";

grant update on table "public"."ad_wallets" to "authenticated";

grant delete on table "public"."ad_wallets" to "service_role";

grant insert on table "public"."ad_wallets" to "service_role";

grant references on table "public"."ad_wallets" to "service_role";

grant select on table "public"."ad_wallets" to "service_role";

grant trigger on table "public"."ad_wallets" to "service_role";

grant truncate on table "public"."ad_wallets" to "service_role";

grant update on table "public"."ad_wallets" to "service_role";


  create policy "ad_campaigns_vendor_all"
  on "public"."ad_campaigns"
  as permissive
  for all
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_campaigns.supplier_id) AND (s.owner_id = auth.uid())))) OR public.staff_has_min_role('manager'::public.staff_role)))
with check (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_campaigns.supplier_id) AND (s.owner_id = auth.uid())))) OR public.staff_has_min_role('manager'::public.staff_role)));



  create policy "ad_clicks_select"
  on "public"."ad_clicks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_clicks.campaign_id) AND ((s.owner_id = auth.uid()) OR public.is_active_staff())))));



  create policy "ad_creatives_via_campaign"
  on "public"."ad_creatives"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_creatives.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))))
with check ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_creatives.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



  create policy "ad_impressions_select"
  on "public"."ad_impressions"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_impressions.campaign_id) AND ((s.owner_id = auth.uid()) OR public.is_active_staff())))));



  create policy "ad_invoices_select"
  on "public"."ad_invoices"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_invoices.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()));



  create policy "ad_keywords_via_campaign"
  on "public"."ad_keywords"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_keywords.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))))
with check ((EXISTS ( SELECT 1
   FROM (public.ad_campaigns c
     JOIN public.suppliers s ON ((s.id = c.supplier_id)))
  WHERE ((c.id = ad_keywords.campaign_id) AND ((s.owner_id = auth.uid()) OR public.staff_has_min_role('manager'::public.staff_role))))));



  create policy "ad_wallet_tx_select"
  on "public"."ad_wallet_transactions"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_wallet_transactions.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()));



  create policy "ad_wallets_select"
  on "public"."ad_wallets"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = ad_wallets.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()));



