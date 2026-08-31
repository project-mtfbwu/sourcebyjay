'use server';

import { authActionClient } from '@/lib/safe-action';
import { assertRateLimit } from '@/lib/rate-limit';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const broadcastSchema = z.object({
  targets: z
    .array(
      z.object({
        supplierId: z.string().uuid(),
        productId: z.string().uuid().optional(),
      }),
    )
    .min(2)
    .max(20),
  message: z.string().min(10).max(2000),
  quantity: z.number().int().positive().optional(),
  contactEmail: z.string().email(),
  title: z.string().max(200).optional(),
});

export const broadcastRfqAction = authActionClient
  .schema(broadcastSchema)
  .action(async ({ parsedInput, ctx }) => {
    assertRateLimit(`broadcast-rfq:${ctx.userId}`, 5, 60 * 60 * 1000);

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('broadcast_rfq', {
      p_targets: parsedInput.targets.map((t) => ({
        supplier_id: t.supplierId,
        product_id: t.productId ?? null,
      })),
      p_message: parsedInput.message,
      p_quantity: parsedInput.quantity ?? null,
      p_contact_email: parsedInput.contactEmail,
      p_title: parsedInput.title ?? null,
    });

    if (error) throw new Error(error.message);
    const payload = data as {
      ok?: boolean;
      inquiry_id?: string;
      delivered?: number;
      skipped_quota?: number;
      error?: string;
    };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Broadcast failed');

    revalidatePath('/account/inquiries');
    return {
      inquiryId: payload.inquiry_id,
      delivered: payload.delivered ?? 0,
      skippedQuota: payload.skipped_quota ?? 0,
    };
  });
