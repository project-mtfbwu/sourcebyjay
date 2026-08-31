'use server';

import { authActionClient } from '@/lib/safe-action';
import { assertRateLimit } from '@/lib/rate-limit';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(4000),
  contactEmail: z.string().email(),
  quantity: z.number().int().positive().optional(),
  categoryHint: z.string().max(120).optional(),
});

export const createListingRequestAction = authActionClient
  .schema(createSchema)
  .action(async ({ parsedInput, ctx }) => {
    assertRateLimit(`listing-req:${ctx.userId}`, 10, 60 * 60 * 1000);
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('create_listing_request', {
      p_title: parsedInput.title,
      p_description: parsedInput.description,
      p_contact_email: parsedInput.contactEmail,
      ...(parsedInput.quantity != null ? { p_quantity: parsedInput.quantity } : {}),
      ...(parsedInput.categoryHint
        ? { p_category_hint: parsedInput.categoryHint }
        : {}),
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; listing_request_id?: string; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'Could not post request');
    revalidatePath('/request-listing');
    revalidatePath('/account/inquiries');
    return { listingRequestId: payload.listing_request_id };
  });
