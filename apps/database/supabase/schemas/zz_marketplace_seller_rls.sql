-- Phase 2: restore seller supplier RLS + signup metadata for separate seller profiles.
-- Buyer and seller are separate identities (see DECISIONS.md).

DROP POLICY IF EXISTS suppliers_insert_own ON public.suppliers;
CREATE POLICY suppliers_insert_own ON public.suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS suppliers_update_own ON public.suppliers;
CREATE POLICY suppliers_update_own ON public.suppliers
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS suppliers_delete_own ON public.suppliers;
CREATE POLICY suppliers_delete_own ON public.suppliers
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Profile created at signup: role from metadata.account_type (buyer|seller), never upgraded in-app.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_type text;
  new_role public.user_role;
BEGIN
  account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer');
  IF account_type = 'seller' THEN
    new_role := 'seller';
  ELSE
    new_role := 'buyer';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    phone,
    company_name,
    country,
    city,
    gstin
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    new_role,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'gstin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Lock role after signup — buyer and seller profiles stay separate.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Profile role cannot be changed. Buyer and seller accounts are separate.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_role ON public.profiles;
CREATE TRIGGER profiles_lock_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();
