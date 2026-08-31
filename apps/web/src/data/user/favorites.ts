'use server';

import { authActionClient } from '@/lib/safe-action';
import { assertRateLimit } from '@/lib/rate-limit';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const toggleSchema = z.object({
  kind: z.enum(['product', 'supplier']),
  supplierId: z.string().uuid(),
  productId: z.string().uuid().optional(),
});

export const toggleFavoriteAction = authActionClient
  .schema(toggleSchema)
  .action(async ({ parsedInput, ctx }) => {
    assertRateLimit(`fav-toggle:${ctx.userId}`, 60, 60 * 60 * 1000);
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('toggle_buyer_favorite', {
      p_kind: parsedInput.kind,
      p_supplier_id: parsedInput.supplierId,
      ...(parsedInput.productId ? { p_product_id: parsedInput.productId } : {}),
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; favorited?: boolean; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Favorite failed');
    revalidatePath('/account/favorites');
    return { favorited: Boolean(payload.favorited) };
  });
