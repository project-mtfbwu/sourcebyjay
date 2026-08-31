-- Form field configs (ops toggles) + phone OTP verification

CREATE TABLE IF NOT EXISTS public.form_field_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona text NOT NULL CHECK (persona IN ('buyer', 'seller')),
  field_key text NOT NULL,
  label text NOT NULL,
  mode text NOT NULL DEFAULT 'optional'
    CHECK (mode IN ('required', 'optional', 'hidden')),
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (persona, field_key)
);

CREATE INDEX IF NOT EXISTS form_field_configs_persona_idx
  ON public.form_field_configs (persona, sort_order);

ALTER TABLE public.form_field_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS form_field_configs_select_all ON public.form_field_configs;
CREATE POLICY form_field_configs_select_all ON public.form_field_configs
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS form_field_configs_staff_write ON public.form_field_configs;
CREATE POLICY form_field_configs_staff_write ON public.form_field_configs
  FOR ALL TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

-- Seed scouted defaults (Amazon Biz / Seller Central / IndiaMART / Alibaba)
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

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('buyer_signup', 'seller_signup', 'verify_phone')),
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otps_phone_idx ON public.phone_otps (phone, purpose);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- OTP rows are only touched via SECURITY DEFINER RPCs (no direct client access).
DROP POLICY IF EXISTS phone_otps_no_direct ON public.phone_otps;
CREATE POLICY phone_otps_no_direct ON public.phone_otps
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.request_phone_otp(p_phone text, p_purpose text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.verify_phone_otp(p_phone text, p_purpose text, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.request_phone_otp(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp(text, text, text) TO anon, authenticated;
