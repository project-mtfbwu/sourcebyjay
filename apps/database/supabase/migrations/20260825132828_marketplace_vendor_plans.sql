create table "public"."listing_plans" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "name" text not null,
    "price_inr_cents_annual" integer not null default 0,
    "max_listings" integer,
    "rank_boost_bps" integer not null default 0,
    "rfq_leads_per_week" integer not null default 0,
    "guarantee_eligible" boolean not null default false,
    "ad_wallet_bonus_inr_cents" integer not null default 0,
    "features" jsonb not null default '{}'::jsonb,
    "active" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."listing_plans" enable row level security;


  create table "public"."vendor_subscription_events" (
    "id" uuid not null default gen_random_uuid(),
    "supplier_id" uuid not null,
    "from_plan_id" uuid,
    "to_plan_id" uuid,
    "event_type" text not null,
    "actor_user_id" uuid,
    "meta" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."vendor_subscription_events" enable row level security;


  create table "public"."vendor_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "supplier_id" uuid not null,
    "plan_id" uuid not null,
    "status" text not null default 'active'::text,
    "started_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone,
    "stripe_subscription_id" text,
    "granted_by_staff_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."vendor_subscriptions" enable row level security;

CREATE INDEX listing_plans_active_sort_idx ON public.listing_plans USING btree (active, sort_order);

CREATE UNIQUE INDEX listing_plans_pkey ON public.listing_plans USING btree (id);

CREATE UNIQUE INDEX listing_plans_slug_key ON public.listing_plans USING btree (slug);

CREATE UNIQUE INDEX vendor_subscription_events_pkey ON public.vendor_subscription_events USING btree (id);

CREATE INDEX vendor_subscription_events_supplier_idx ON public.vendor_subscription_events USING btree (supplier_id, created_at DESC);

CREATE UNIQUE INDEX vendor_subscriptions_one_active_idx ON public.vendor_subscriptions USING btree (supplier_id) WHERE (status = ANY (ARRAY['active'::text, 'comped'::text]));

CREATE UNIQUE INDEX vendor_subscriptions_pkey ON public.vendor_subscriptions USING btree (id);

CREATE INDEX vendor_subscriptions_supplier_idx ON public.vendor_subscriptions USING btree (supplier_id);

alter table "public"."listing_plans" add constraint "listing_plans_pkey" PRIMARY KEY using index "listing_plans_pkey";

alter table "public"."vendor_subscription_events" add constraint "vendor_subscription_events_pkey" PRIMARY KEY using index "vendor_subscription_events_pkey";

alter table "public"."vendor_subscriptions" add constraint "vendor_subscriptions_pkey" PRIMARY KEY using index "vendor_subscriptions_pkey";

alter table "public"."listing_plans" add constraint "listing_plans_ad_wallet_bonus_inr_cents_check" CHECK ((ad_wallet_bonus_inr_cents >= 0)) not valid;

alter table "public"."listing_plans" validate constraint "listing_plans_ad_wallet_bonus_inr_cents_check";

alter table "public"."listing_plans" add constraint "listing_plans_price_inr_cents_annual_check" CHECK ((price_inr_cents_annual >= 0)) not valid;

alter table "public"."listing_plans" validate constraint "listing_plans_price_inr_cents_annual_check";

alter table "public"."listing_plans" add constraint "listing_plans_rank_boost_bps_check" CHECK (((rank_boost_bps >= 0) AND (rank_boost_bps <= 10000))) not valid;

alter table "public"."listing_plans" validate constraint "listing_plans_rank_boost_bps_check";

alter table "public"."listing_plans" add constraint "listing_plans_rfq_leads_per_week_check" CHECK ((rfq_leads_per_week >= 0)) not valid;

alter table "public"."listing_plans" validate constraint "listing_plans_rfq_leads_per_week_check";

alter table "public"."listing_plans" add constraint "listing_plans_slug_check" CHECK ((slug = ANY (ARRAY['free'::text, 'starter'::text, 'pro'::text, 'business'::text, 'export'::text, 'enterprise'::text]))) not valid;

alter table "public"."listing_plans" validate constraint "listing_plans_slug_check";

alter table "public"."listing_plans" add constraint "listing_plans_slug_key" UNIQUE using index "listing_plans_slug_key";

alter table "public"."vendor_subscription_events" add constraint "vendor_subscription_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."vendor_subscription_events" validate constraint "vendor_subscription_events_actor_user_id_fkey";

alter table "public"."vendor_subscription_events" add constraint "vendor_subscription_events_event_type_check" CHECK ((event_type = ANY (ARRAY['signup_default'::text, 'upgrade'::text, 'downgrade'::text, 'comp_grant'::text, 'cancel'::text, 'expire'::text, 'ops_assign'::text]))) not valid;

alter table "public"."vendor_subscription_events" validate constraint "vendor_subscription_events_event_type_check";

alter table "public"."vendor_subscription_events" add constraint "vendor_subscription_events_from_plan_id_fkey" FOREIGN KEY (from_plan_id) REFERENCES public.listing_plans(id) ON DELETE SET NULL not valid;

alter table "public"."vendor_subscription_events" validate constraint "vendor_subscription_events_from_plan_id_fkey";

alter table "public"."vendor_subscription_events" add constraint "vendor_subscription_events_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_subscription_events" validate constraint "vendor_subscription_events_supplier_id_fkey";

alter table "public"."vendor_subscription_events" add constraint "vendor_subscription_events_to_plan_id_fkey" FOREIGN KEY (to_plan_id) REFERENCES public.listing_plans(id) ON DELETE SET NULL not valid;

alter table "public"."vendor_subscription_events" validate constraint "vendor_subscription_events_to_plan_id_fkey";

alter table "public"."vendor_subscriptions" add constraint "vendor_subscriptions_granted_by_staff_id_fkey" FOREIGN KEY (granted_by_staff_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."vendor_subscriptions" validate constraint "vendor_subscriptions_granted_by_staff_id_fkey";

alter table "public"."vendor_subscriptions" add constraint "vendor_subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.listing_plans(id) not valid;

alter table "public"."vendor_subscriptions" validate constraint "vendor_subscriptions_plan_id_fkey";

alter table "public"."vendor_subscriptions" add constraint "vendor_subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'cancelled'::text, 'comped'::text]))) not valid;

alter table "public"."vendor_subscriptions" validate constraint "vendor_subscriptions_status_check";

alter table "public"."vendor_subscriptions" add constraint "vendor_subscriptions_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_subscriptions" validate constraint "vendor_subscriptions_supplier_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_free_plan_on_supplier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_listing_plans_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.supplier_active_plan(p_supplier_id uuid)
 RETURNS public.listing_plans
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT lp.*
  FROM public.vendor_subscriptions vs
  JOIN public.listing_plans lp ON lp.id = vs.plan_id
  WHERE vs.supplier_id = p_supplier_id
    AND vs.status IN ('active', 'comped')
    AND (vs.expires_at IS NULL OR vs.expires_at > now())
  ORDER BY vs.started_at DESC
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.supplier_can_publish_listing(p_supplier_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

grant delete on table "public"."listing_plans" to "anon";

grant insert on table "public"."listing_plans" to "anon";

grant references on table "public"."listing_plans" to "anon";

grant select on table "public"."listing_plans" to "anon";

grant trigger on table "public"."listing_plans" to "anon";

grant truncate on table "public"."listing_plans" to "anon";

grant update on table "public"."listing_plans" to "anon";

grant delete on table "public"."listing_plans" to "authenticated";

grant insert on table "public"."listing_plans" to "authenticated";

grant references on table "public"."listing_plans" to "authenticated";

grant select on table "public"."listing_plans" to "authenticated";

grant trigger on table "public"."listing_plans" to "authenticated";

grant truncate on table "public"."listing_plans" to "authenticated";

grant update on table "public"."listing_plans" to "authenticated";

grant delete on table "public"."listing_plans" to "service_role";

grant insert on table "public"."listing_plans" to "service_role";

grant references on table "public"."listing_plans" to "service_role";

grant select on table "public"."listing_plans" to "service_role";

grant trigger on table "public"."listing_plans" to "service_role";

grant truncate on table "public"."listing_plans" to "service_role";

grant update on table "public"."listing_plans" to "service_role";

grant delete on table "public"."vendor_subscription_events" to "anon";

grant insert on table "public"."vendor_subscription_events" to "anon";

grant references on table "public"."vendor_subscription_events" to "anon";

grant select on table "public"."vendor_subscription_events" to "anon";

grant trigger on table "public"."vendor_subscription_events" to "anon";

grant truncate on table "public"."vendor_subscription_events" to "anon";

grant update on table "public"."vendor_subscription_events" to "anon";

grant delete on table "public"."vendor_subscription_events" to "authenticated";

grant insert on table "public"."vendor_subscription_events" to "authenticated";

grant references on table "public"."vendor_subscription_events" to "authenticated";

grant select on table "public"."vendor_subscription_events" to "authenticated";

grant trigger on table "public"."vendor_subscription_events" to "authenticated";

grant truncate on table "public"."vendor_subscription_events" to "authenticated";

grant update on table "public"."vendor_subscription_events" to "authenticated";

grant delete on table "public"."vendor_subscription_events" to "service_role";

grant insert on table "public"."vendor_subscription_events" to "service_role";

grant references on table "public"."vendor_subscription_events" to "service_role";

grant select on table "public"."vendor_subscription_events" to "service_role";

grant trigger on table "public"."vendor_subscription_events" to "service_role";

grant truncate on table "public"."vendor_subscription_events" to "service_role";

grant update on table "public"."vendor_subscription_events" to "service_role";

grant delete on table "public"."vendor_subscriptions" to "anon";

grant insert on table "public"."vendor_subscriptions" to "anon";

grant references on table "public"."vendor_subscriptions" to "anon";

grant select on table "public"."vendor_subscriptions" to "anon";

grant trigger on table "public"."vendor_subscriptions" to "anon";

grant truncate on table "public"."vendor_subscriptions" to "anon";

grant update on table "public"."vendor_subscriptions" to "anon";

grant delete on table "public"."vendor_subscriptions" to "authenticated";

grant insert on table "public"."vendor_subscriptions" to "authenticated";

grant references on table "public"."vendor_subscriptions" to "authenticated";

grant select on table "public"."vendor_subscriptions" to "authenticated";

grant trigger on table "public"."vendor_subscriptions" to "authenticated";

grant truncate on table "public"."vendor_subscriptions" to "authenticated";

grant update on table "public"."vendor_subscriptions" to "authenticated";

grant delete on table "public"."vendor_subscriptions" to "service_role";

grant insert on table "public"."vendor_subscriptions" to "service_role";

grant references on table "public"."vendor_subscriptions" to "service_role";

grant select on table "public"."vendor_subscriptions" to "service_role";

grant trigger on table "public"."vendor_subscriptions" to "service_role";

grant truncate on table "public"."vendor_subscriptions" to "service_role";

grant update on table "public"."vendor_subscriptions" to "service_role";


  create policy "listing_plans_select_all"
  on "public"."listing_plans"
  as permissive
  for select
  to anon, authenticated
using (((active = true) OR public.is_active_staff()));



  create policy "listing_plans_staff_write"
  on "public"."listing_plans"
  as permissive
  for all
  to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());



  create policy "vendor_subscription_events_select"
  on "public"."vendor_subscription_events"
  as permissive
  for select
  to authenticated
using ((public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = vendor_subscription_events.supplier_id) AND (s.owner_id = auth.uid()))))));



  create policy "vendor_subscription_events_staff_insert"
  on "public"."vendor_subscription_events"
  as permissive
  for insert
  to authenticated
with check (public.is_active_staff());



  create policy "vendor_subscriptions_select"
  on "public"."vendor_subscriptions"
  as permissive
  for select
  to authenticated
using ((public.is_active_staff() OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = vendor_subscriptions.supplier_id) AND (s.owner_id = auth.uid()))))));



  create policy "vendor_subscriptions_staff_write"
  on "public"."vendor_subscriptions"
  as permissive
  for all
  to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());


CREATE TRIGGER set_listing_plans_updated_at BEFORE UPDATE ON public.listing_plans FOR EACH ROW EXECUTE FUNCTION public.set_listing_plans_updated_at();

CREATE TRIGGER suppliers_assign_free_plan AFTER INSERT ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.assign_free_plan_on_supplier();

CREATE TRIGGER set_vendor_subscriptions_updated_at BEFORE UPDATE ON public.vendor_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_listing_plans_updated_at();

grant execute on function public.supplier_active_plan(uuid) to anon, authenticated;
grant execute on function public.supplier_can_publish_listing(uuid) to authenticated;

INSERT INTO public.listing_plans (
  slug, name, price_inr_cents_annual, max_listings, rank_boost_bps,
  rfq_leads_per_week, guarantee_eligible, ad_wallet_bonus_inr_cents, features, sort_order
) VALUES
  ('free', 'Free', 0, 5, 0, 0, false, 0, '{"badge":"basic","gallery_slots":5}'::jsonb, 10),
  ('starter', 'Starter', 999900, 25, 1000, 3, false, 50000, '{"badge":"basic","gallery_slots":15,"email_support":true}'::jsonb, 20),
  ('pro', 'Pro', 2999900, 100, 2500, 10, true, 200000, '{"badge":"pro","gallery_slots":50,"guarantee":true}'::jsonb, 30),
  ('business', 'Business', 5999900, 500, 4000, 25, true, 500000, '{"badge":"business","gallery_slots":100,"video_tab":true,"priority_storefront":true}'::jsonb, 40),
  ('export', 'Export', 9999900, NULL, 5000, 40, true, 1000000, '{"badge":"export","gallery_slots":100,"intl_highlight":true,"usd_pricing":true}'::jsonb, 50),
  ('enterprise', 'Enterprise', 0, NULL, 10000, 999, true, 0, '{"badge":"enterprise","gallery_slots":null,"dedicated_manager":true,"custom":true}'::jsonb, 60)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.vendor_subscriptions (supplier_id, plan_id, status)
SELECT s.id, lp.id, 'active'
FROM public.suppliers s
CROSS JOIN public.listing_plans lp
WHERE lp.slug = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM public.vendor_subscriptions vs
    WHERE vs.supplier_id = s.id AND vs.status IN ('active', 'comped')
  );
