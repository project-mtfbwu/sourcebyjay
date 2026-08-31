import { createClient } from '@/lib/supabase';
import {
  DEFAULT_FORM_FIELDS,
  type FormFieldConfig,
  type FormPersona,
} from '@sourcebyjay/types';

/** Load ops-controlled signup fields (not a server action — safe for RSC). */
export async function getFormFieldConfigs(persona: FormPersona): Promise<FormFieldConfig[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('form_field_configs')
      .select('id, persona, field_key, label, mode, sort_order')
      .eq('persona', persona)
      .order('sort_order');

    if (error || !data?.length) {
      return DEFAULT_FORM_FIELDS.filter((f) => f.persona === persona);
    }

    return data.map((r) => ({
      id: r.id as string,
      persona: r.persona as FormPersona,
      fieldKey: r.field_key as string,
      label: r.label as string,
      mode: r.mode as FormFieldConfig['mode'],
      sortOrder: r.sort_order as number,
    }));
  } catch {
    return DEFAULT_FORM_FIELDS.filter((f) => f.persona === persona);
  }
}
