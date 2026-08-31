alter table "public"."platform_settings" drop constraint "platform_settings_bps_range";


  create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "buyer_id" uuid not null,
    "supplier_id" uuid not null,
    "inquiry_id" uuid,
    "product_id" uuid,
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."conversations" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "sender_id" uuid not null,
    "body" text not null,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."messages" enable row level security;

CREATE INDEX conversations_buyer_idx ON public.conversations USING btree (buyer_id, last_message_at DESC NULLS LAST);

CREATE UNIQUE INDEX conversations_buyer_supplier_unique ON public.conversations USING btree (buyer_id, supplier_id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE INDEX conversations_supplier_idx ON public.conversations USING btree (supplier_id, last_message_at DESC NULLS LAST);

CREATE INDEX messages_conversation_idx ON public.messages USING btree (conversation_id, created_at);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."conversations" add constraint "conversations_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_buyer_id_fkey";

alter table "public"."conversations" add constraint "conversations_buyer_supplier_unique" UNIQUE using index "conversations_buyer_supplier_unique";

alter table "public"."conversations" add constraint "conversations_inquiry_id_fkey" FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL not valid;

alter table "public"."conversations" validate constraint "conversations_inquiry_id_fkey";

alter table "public"."conversations" add constraint "conversations_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."conversations" validate constraint "conversations_product_id_fkey";

alter table "public"."conversations" add constraint "conversations_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_supplier_id_fkey";

alter table "public"."messages" add constraint "messages_body_check" CHECK (((char_length(TRIM(BOTH FROM body)) >= 1) AND (char_length(body) <= 4000))) not valid;

alter table "public"."messages" validate constraint "messages_body_check";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."platform_settings" add constraint "platform_settings_bps_range" CHECK ((((default_commission_bps >= 0) AND (default_commission_bps <= 10000)) AND ((min_commission_bps >= 0) AND (min_commission_bps <= 10000)))) not valid;

alter table "public"."platform_settings" validate constraint "platform_settings_bps_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.open_conversation(p_supplier_id uuid, p_inquiry_id uuid DEFAULT NULL::uuid, p_product_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.send_chat_message(p_conversation_id uuid, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";


  create policy "conversations_insert_buyer"
  on "public"."conversations"
  as permissive
  for insert
  to authenticated
with check ((buyer_id = auth.uid()));



  create policy "conversations_select"
  on "public"."conversations"
  as permissive
  for select
  to authenticated
using (((buyer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = conversations.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()));



  create policy "conversations_update_participants"
  on "public"."conversations"
  as permissive
  for update
  to authenticated
using (((buyer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = conversations.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()))
with check (((buyer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.suppliers s
  WHERE ((s.id = conversations.supplier_id) AND (s.owner_id = auth.uid())))) OR public.is_active_staff()));



  create policy "messages_insert"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check (((sender_id = auth.uid()) AND public.is_conversation_participant(conversation_id)));



  create policy "messages_select"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using (public.is_conversation_participant(conversation_id));



  create policy "messages_update_read"
  on "public"."messages"
  as permissive
  for update
  to authenticated
using ((public.is_conversation_participant(conversation_id) AND (sender_id <> auth.uid())))
with check ((public.is_conversation_participant(conversation_id) AND (sender_id <> auth.uid())));



