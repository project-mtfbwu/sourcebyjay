'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const acceptQuoteAction = authActionClient
  .schema(z.object({ quoteId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('accept_quote', {
      p_quote_id: parsedInput.quoteId,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; order_id?: string; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not accept quote');
    revalidatePath('/account/quotes');
    revalidatePath('/account/orders');
    return { orderId: payload.order_id };
  });

export const rejectQuoteAction = authActionClient
  .schema(z.object({ quoteId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('reject_quote', {
      p_quote_id: parsedInput.quoteId,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not reject quote');
    revalidatePath('/account/quotes');
    return { success: true };
  });

export const fakeMarkOrderPaidAction = authActionClient
  .schema(
    z.object({
      orderId: z.string().uuid(),
      acceptGuaranteeTerms: z.boolean().optional().default(false),
    }),
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('fake_mark_order_paid', {
      p_order_id: parsedInput.orderId,
      p_accept_guarantee_terms: parsedInput.acceptGuaranteeTerms ?? false,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not mark paid');
    revalidatePath('/account/orders');
    return { success: true };
  });

export const openOrderDisputeAction = authActionClient
  .schema(
    z.object({
      orderId: z.string().uuid(),
      reason: z.enum([
        'quality_mismatch',
        'not_shipped',
        'wrong_quantity',
        'damaged',
        'non_delivery',
        'gst_invoice',
        'other',
      ]),
      buyerNote: z.string().max(2000).optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('open_order_dispute', {
      p_order_id: parsedInput.orderId,
      p_reason: parsedInput.reason,
      p_buyer_note: parsedInput.buyerNote ?? undefined,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; error?: string; dispute_id?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not open dispute');
    revalidatePath('/account/orders');
    revalidatePath(`/account/orders/${parsedInput.orderId}/dispute`);
    return { disputeId: payload.dispute_id };
  });

export const addDisputeMessageAction = authActionClient
  .schema(
    z.object({
      disputeId: z.string().uuid(),
      body: z.string().min(1).max(4000),
    }),
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('add_dispute_message', {
      p_dispute_id: parsedInput.disputeId,
      p_body: parsedInput.body,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not send message');
    revalidatePath('/account/orders');
    return { success: true };
  });

export const cancelUnpaidOrderAction = authActionClient
  .schema(z.object({ orderId: z.string().uuid(), note: z.string().max(500).optional() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('cancel_unpaid_order', {
      p_order_id: parsedInput.orderId,
      p_note: parsedInput.note ?? undefined,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not cancel order');
    revalidatePath('/account/orders');
    return { success: true };
  });

export const returnEscrowToBuyerAction = authActionClient
  .schema(z.object({ orderId: z.string().uuid(), note: z.string().max(500).optional() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('return_escrow_to_buyer', {
      p_order_id: parsedInput.orderId,
      p_note: parsedInput.note ?? undefined,
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not refund');
    revalidatePath('/account/orders');
    return { success: true };
  });
