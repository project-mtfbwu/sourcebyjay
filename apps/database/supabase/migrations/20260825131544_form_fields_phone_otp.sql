  create table "public"."form_field_configs" (
    "id" uuid not null default gen_random_uuid(),
    "persona" text not null,
    "field_key" text not null,
    "label" text not null,
    "mode" text not null default 'optional'::text,
    "sort_order" integer not null default 0,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."form_field_configs" enable row level security;


  create table "public"."phone_otps" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text not null,
    "code_hash" text not null,
    "purpose" text not null,
    "attempts" integer not null default 0,
    "expires_at" timestamp with time zone not null,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."phone_otps" enable row level security;

alter table "public"."profiles" add column "phone_verified_at" timestamp with time zone;

CREATE UNIQUE INDEX form_field_configs_persona_field_key_key ON public.form_field_configs USING btree (persona, field_key);

CREATE INDEX form_field_configs_persona_idx ON public.form_field_configs USING btree (persona, sort_order);

CREATE UNIQUE INDEX form_field_configs_pkey ON public.form_field_configs USING btree (id);

CREATE INDEX phone_otps_phone_idx ON public.phone_otps USING btree (phone, purpose);

CREATE UNIQUE INDEX phone_otps_pkey ON public.phone_otps USING btree (id);

alter table "public"."form_field_configs" add constraint "form_field_configs_pkey" PRIMARY KEY using index "form_field_configs_pkey";

alter table "public"."phone_otps" add constraint "phone_otps_pkey" PRIMARY KEY using index "phone_otps_pkey";

alter table "public"."form_field_configs" add constraint "form_field_configs_mode_check" CHECK ((mode = ANY (ARRAY['required'::text, 'optional'::text, 'hidden'::text]))) not valid;

alter table "public"."form_field_configs" validate constraint "form_field_configs_mode_check";

alter table "public"."form_field_configs" add constraint "form_field_configs_persona_check" CHECK ((persona = ANY (ARRAY['buyer'::text, 'seller'::text]))) not valid;

alter table "public"."form_field_configs" validate constraint "form_field_configs_persona_check";

alter table "public"."form_field_configs" add constraint "form_field_configs_persona_field_key_key" UNIQUE using index "form_field_configs_persona_field_key_key";

alter table "public"."form_field_configs" add constraint "form_field_configs_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."form_field_configs" validate constraint "form_field_configs_updated_by_fkey";

alter table "public"."phone_otps" add constraint "phone_otps_purpose_check" CHECK ((purpose = ANY (ARRAY['buyer_signup'::text, 'seller_signup'::text, 'verify_phone'::text]))) not valid;

alter table "public"."phone_otps" validate constraint "phone_otps_purpose_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.request_phone_otp(p_phone text, p_purpose text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_code text;
  v_hash text;
  v_mode text := coalesce(current_setting('app.phone_otp_mode', true), 'dev');
BEGIN
  IF p_phone IS NULL OR length(trim(p_phone)) < 8 THEN
    RAISE EXCEPTION 'Phone number required';
  END IF;
  IF p_purpose NOT IN ('buyer_signup', 'seller_signup', 'verify_phone') THEN
    RAISE EXCEPTION 'Invalid purpose';
  END IF;

  -- Local/dev: fixed code 123456. Production: random 6-digit (wire SMS later).
  IF v_mode = 'dev' THEN
    v_code := '123456';
  ELSE
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  END IF;

  v_hash := encode(digest(v_code || ':' || trim(p_phone), 'sha256'), 'hex');

  DELETE FROM public.phone_otps
  WHERE phone = trim(p_phone) AND purpose = p_purpose AND consumed_at IS NULL;

  INSERT INTO public.phone_otps (phone, code_hash, purpose, expires_at)
  VALUES (trim(p_phone), v_hash, p_purpose, now() + interval '10 minutes');

  -- In dev we return the code so SMS provider is not required.
  IF v_mode = 'dev' THEN
    RETURN jsonb_build_object('ok', true, 'dev_code', v_code, 'expires_in_sec', 600);
  END IF;

  RETURN jsonb_build_object('ok', true, 'expires_in_sec', 600);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_phone_otp(p_phone text, p_purpose text, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_row public.phone_otps%ROWTYPE;
  v_hash text;
BEGIN
  SELECT * INTO v_row
  FROM public.phone_otps
  WHERE phone = trim(p_phone)
    AND purpose = p_purpose
    AND consumed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No OTP found. Request a new code.');
  END IF;

  IF v_row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'OTP expired. Request a new code.');
  END IF;

  IF v_row.attempts >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Too many attempts. Request a new code.');
  END IF;

  v_hash := encode(digest(trim(p_code) || ':' || trim(p_phone), 'sha256'), 'hex');

  IF v_hash <> v_row.code_hash THEN
    UPDATE public.phone_otps SET attempts = attempts + 1 WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Wrong code.');
  END IF;

  UPDATE public.phone_otps SET consumed_at = now() WHERE id = v_row.id;

  IF auth.uid() IS NOT NULL THEN
    UPDATE public.profiles
    SET phone = trim(p_phone), phone_verified_at = now()
    WHERE id = auth.uid();
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$
;

grant delete on table "public"."form_field_configs" to "anon";

grant insert on table "public"."form_field_configs" to "anon";

grant references on table "public"."form_field_configs" to "anon";

grant select on table "public"."form_field_configs" to "anon";

grant trigger on table "public"."form_field_configs" to "anon";

grant truncate on table "public"."form_field_configs" to "anon";

grant update on table "public"."form_field_configs" to "anon";

grant delete on table "public"."form_field_configs" to "authenticated";

grant insert on table "public"."form_field_configs" to "authenticated";

grant references on table "public"."form_field_configs" to "authenticated";

grant select on table "public"."form_field_configs" to "authenticated";

grant trigger on table "public"."form_field_configs" to "authenticated";

grant truncate on table "public"."form_field_configs" to "authenticated";

grant update on table "public"."form_field_configs" to "authenticated";

grant delete on table "public"."form_field_configs" to "service_role";

grant insert on table "public"."form_field_configs" to "service_role";

grant references on table "public"."form_field_configs" to "service_role";

grant select on table "public"."form_field_configs" to "service_role";

grant trigger on table "public"."form_field_configs" to "service_role";

grant truncate on table "public"."form_field_configs" to "service_role";

grant update on table "public"."form_field_configs" to "service_role";

grant delete on table "public"."phone_otps" to "anon";

grant insert on table "public"."phone_otps" to "anon";

grant references on table "public"."phone_otps" to "anon";

grant select on table "public"."phone_otps" to "anon";

grant trigger on table "public"."phone_otps" to "anon";

grant truncate on table "public"."phone_otps" to "anon";

grant update on table "public"."phone_otps" to "anon";

grant delete on table "public"."phone_otps" to "authenticated";

grant insert on table "public"."phone_otps" to "authenticated";

grant references on table "public"."phone_otps" to "authenticated";

grant select on table "public"."phone_otps" to "authenticated";

grant trigger on table "public"."phone_otps" to "authenticated";

grant truncate on table "public"."phone_otps" to "authenticated";

grant update on table "public"."phone_otps" to "authenticated";

grant delete on table "public"."phone_otps" to "service_role";

grant insert on table "public"."phone_otps" to "service_role";

grant references on table "public"."phone_otps" to "service_role";

grant select on table "public"."phone_otps" to "service_role";

grant trigger on table "public"."phone_otps" to "service_role";

grant truncate on table "public"."phone_otps" to "service_role";

grant update on table "public"."phone_otps" to "service_role";


  create policy "form_field_configs_select_all"
  on "public"."form_field_configs"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "form_field_configs_staff_write"
  on "public"."form_field_configs"
  as permissive
  for all
  to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());



  create policy "phone_otps_no_direct"
  on "public"."phone_otps"
  as permissive
  for all
  to authenticated, anon
using (false)
with check (false);

grant execute on function public.request_phone_otp(text, text) to anon, authenticated;
grant execute on function public.verify_phone_otp(text, text, text) to anon, authenticated;

-- Seed scouted defaults (DML not captured by db diff)
INSERT INTO public.form_field_configs (persona, field_key, label, mode, sort_order) VALUES
  ('buyer', 'full_name', 'Full name', 'required', 10),
  ('buyer', 'email', 'Email', 'required', 20),
  ('buyer', 'phone', 'Phone', 'required', 30),
  ('buyer', 'password', 'Password', 'required', 40),
  ('buyer', 'company_name', 'Company name', 'optional', 50),
  ('buyer', 'gstin', 'GSTIN', 'optional', 60),
  ('buyer', 'industry', 'Industry', 'optional', 70),
  ('buyer', 'country', 'Country', 'optional', 80),
  ('buyer', 'city', 'City', 'optional', 90),
  ('seller', 'full_name', 'Full name', 'required', 10),
  ('seller', 'email', 'Work email', 'required', 20),
  ('seller', 'phone', 'Phone', 'required', 30),
  ('seller', 'password', 'Password', 'required', 40),
  ('seller', 'company_name', 'Company name', 'required', 50),
  ('seller', 'gstin', 'GSTIN', 'required', 60),
  ('seller', 'country', 'Country', 'required', 70),
  ('seller', 'city', 'City', 'required', 80),
  ('seller', 'main_products', 'Main products', 'required', 90),
  ('seller', 'description', 'Company description', 'optional', 100)
ON CONFLICT (persona, field_key) DO NOTHING;

