'use server';

import { authActionClient } from '@/lib/safe-action';
import { assertRateLimit } from '@/lib/rate-limit';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const openSchema = z.object({
  supplierId: z.string().uuid(),
  inquiryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});

export const openConversationAction = authActionClient
  .schema(openSchema)
  .action(async ({ parsedInput, ctx }) => {
    assertRateLimit(`open-chat:${ctx.userId}`, 30, 60 * 60 * 1000);
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('open_conversation', {
      p_supplier_id: parsedInput.supplierId,
      ...(parsedInput.inquiryId ? { p_inquiry_id: parsedInput.inquiryId } : {}),
      ...(parsedInput.productId ? { p_product_id: parsedInput.productId } : {}),
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; conversation_id?: string; error?: string };
    if (!payload?.ok || !payload.conversation_id) {
      throw new Error(payload?.error ?? 'Could not open chat');
    }
    revalidatePath('/account/messages');
    return { conversationId: payload.conversation_id };
  });

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export const sendChatMessageAction = authActionClient
  .schema(sendSchema)
  .action(async ({ parsedInput, ctx }) => {
    assertRateLimit(`send-chat:${ctx.userId}`, 120, 60 * 60 * 1000);
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('send_chat_message', {
      p_conversation_id: parsedInput.conversationId,
      p_body: parsedInput.body,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; message_id?: string; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Send failed');
    revalidatePath('/account/messages');
    return { messageId: payload.message_id };
  });
