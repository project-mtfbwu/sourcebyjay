'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import { z } from 'zod';

const inquirySchema = z.object({
  productId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  message: z.string().min(10).max(2000),
  quantity: z.number().int().positive().optional(),
  contactEmail: z.string().email(),
});

export const submitInquiryAction = authActionClient
  .schema(inquirySchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseClient();

    const { error } = await supabase.from('inquiries').insert({
      product_id: parsedInput.productId ?? null,
      supplier_id: parsedInput.supplierId ?? null,
      message: parsedInput.message,
      quantity: parsedInput.quantity ?? null,
      contact_email: parsedInput.contactEmail,
      user_id: ctx.userId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });
