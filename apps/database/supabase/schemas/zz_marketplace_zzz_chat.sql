-- Phase 5: buyer ↔ supplier chat (Alibaba Message Center style)

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_buyer_supplier_unique UNIQUE (buyer_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS conversations_buyer_idx
  ON public.conversations (buyer_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS conversations_supplier_idx
  ON public.conversations (supplier_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) >= 1 AND char_length(body) <= 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON public.messages (conversation_id, created_at ASC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (
        c.buyer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.suppliers s
          WHERE s.id = c.supplier_id AND s.owner_id = auth.uid()
        )
        OR public.is_active_staff()
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated;

DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = conversations.supplier_id AND s.owner_id = auth.uid()
    )
    OR public.is_active_staff()
  );

DROP POLICY IF EXISTS conversations_insert_buyer ON public.conversations;
CREATE POLICY conversations_insert_buyer ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS conversations_update_participants ON public.conversations;
CREATE POLICY conversations_update_participants ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = conversations.supplier_id AND s.owner_id = auth.uid()
    )
    OR public.is_active_staff()
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = conversations.supplier_id AND s.owner_id = auth.uid()
    )
    OR public.is_active_staff()
  );

DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id));

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id)
  );

DROP POLICY IF EXISTS messages_update_read ON public.messages;
CREATE POLICY messages_update_read ON public.messages
  FOR UPDATE TO authenticated
  USING (
    public.is_conversation_participant(conversation_id)
    AND sender_id <> auth.uid()
  )
  WITH CHECK (
    public.is_conversation_participant(conversation_id)
    AND sender_id <> auth.uid()
  );

-- Buyer opens (or reuses) a 1:1 thread with a supplier
CREATE OR REPLACE FUNCTION public.open_conversation(
  p_supplier_id uuid,
  p_inquiry_id uuid DEFAULT NULL,
  p_product_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Supplier not found');
  END IF;

  -- Ignore stale/mock IDs so chat still opens (supplier is the thread key)
  IF p_product_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.products WHERE id = p_product_id
  ) THEN
    p_product_id := NULL;
  END IF;

  IF p_inquiry_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.inquiries WHERE id = p_inquiry_id
  ) THEN
    p_inquiry_id := NULL;
  END IF;

  INSERT INTO public.conversations (buyer_id, supplier_id, inquiry_id, product_id)
  VALUES (
    v_uid,
    p_supplier_id,
    p_inquiry_id,
    p_product_id
  )
  ON CONFLICT (buyer_id, supplier_id) DO UPDATE
    SET
      inquiry_id = COALESCE(EXCLUDED.inquiry_id, conversations.inquiry_id),
      product_id = COALESCE(EXCLUDED.product_id, conversations.product_id),
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'conversation_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_conversation(uuid, uuid, uuid) TO authenticated;

-- Send message + bump conversation last_message_at
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_conversation_id uuid,
  p_body text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_msg_id uuid;
  v_trimmed text := trim(coalesce(p_body, ''));
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sign in required');
  END IF;

  IF char_length(v_trimmed) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Message cannot be empty');
  END IF;

  IF char_length(v_trimmed) > 4000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Message too long');
  END IF;

  IF NOT public.is_conversation_participant(p_conversation_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed');
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, body)
  VALUES (p_conversation_id, v_uid, v_trimmed)
  RETURNING id INTO v_msg_id;

  UPDATE public.conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = p_conversation_id;

  RETURN jsonb_build_object('ok', true, 'message_id', v_msg_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_chat_message(uuid, text) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- Realtime for live chat (local + hosted)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
