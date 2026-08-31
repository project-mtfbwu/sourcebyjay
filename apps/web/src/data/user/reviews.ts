'use server';

import { authActionClient } from '@/lib/safe-action';
import { assertRateLimit } from '@/lib/rate-limit';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const reviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(2000),
  title: z.string().max(120).optional(),
});

export const createReviewAction = authActionClient
  .schema(reviewSchema)
  .action(async ({ parsedInput, ctx }) => {
    assertRateLimit(`review:${ctx.userId}`, 10, 60 * 60 * 1000);
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('create_verified_review', {
      p_order_id: parsedInput.orderId,
      p_rating: parsedInput.rating,
      p_body: parsedInput.body,
      ...(parsedInput.title ? { p_title: parsedInput.title } : {}),
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; review_id?: string; error?: string };
    if (!payload?.ok) {
      const map: Record<string, string> = {
        order_not_completed: 'Order must be completed before you can review.',
        already_reviewed: 'You already reviewed this order.',
        not_your_order: 'That is not your order.',
      };
      throw new Error(map[payload?.error ?? ''] ?? payload?.error ?? 'Review failed');
    }
    revalidatePath('/account/orders');
    revalidatePath('/products', 'layout');
    revalidatePath('/suppliers', 'layout');
    return { reviewId: payload.review_id };
  });
