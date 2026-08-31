import { canAccessPortal, hasStaffRole } from '@sourcebyjay/auth';
import { createClient } from '@/lib/supabase';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';
import { FormFieldsClient } from './FormFieldsClient';
import type { FormFieldMode } from '@sourcebyjay/types';

export default async function FormFieldsPage() {
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  if (!hasStaffRole(staff?.role, 'manager')) {
    return (
      <OpsDenied message="Manager+ required to edit form field toggles. Viewers: ask a manager." />
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('form_field_configs')
    .select('id, persona, field_key, label, mode, sort_order')
    .order('persona')
    .order('sort_order');

  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    persona: r.persona as string,
    fieldKey: r.field_key as string,
    label: r.label as string,
    mode: r.mode as FormFieldMode,
    sortOrder: r.sort_order as number,
  }));

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Signup form fields"
      subtitle="Turn buyer/seller signup fields required, optional, or hidden — without a code deploy."
    >
      <FormFieldsClient rows={rows} />
    </OpsShell>
  );
}
