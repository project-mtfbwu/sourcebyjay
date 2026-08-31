'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import type { FormFieldMode } from '@sourcebyjay/types';

export async function updateFormFieldModeAction(
  id: string,
  mode: FormFieldMode,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user, profile, staff } = await getOpsSession();
  if (!user || !canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return { ok: false, error: 'Staff access required.' };
  }
  if (!hasStaffRole(staff?.role, 'manager')) {
    return { ok: false, error: 'Manager+ required to change form fields.' };
  }
  if (!['required', 'optional', 'hidden'].includes(mode)) {
    return { ok: false, error: 'Invalid mode.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('form_field_configs')
    .update({
      mode,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/form-fields');
  return { ok: true };
}
