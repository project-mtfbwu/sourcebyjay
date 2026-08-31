'use client';

import { useTransition } from 'react';
import { assignVendorPlanAction } from '@/lib/plan-actions';

export function AssignPlanForm({
  supplierId,
  plans,
}: {
  supplierId: string;
  plans: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="card"
      style={{ marginTop: '1rem' }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await assignVendorPlanAction({
            supplierId,
            planId: String(fd.get('planId') ?? ''),
            status: fd.get('status') === 'comped' ? 'comped' : 'active',
            notes: String(fd.get('notes') ?? ''),
          });
          if (!result.ok) alert(result.error);
          else window.location.reload();
        });
      }}
    >
      <h2 style={{ marginTop: 0 }}>Assign / comp plan</h2>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Plan
        <select name="planId" required style={{ display: 'block', width: '100%', marginTop: 4 }}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Status
        <select name="status" defaultValue="active" style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="active">active (paid / assigned)</option>
          <option value="comped">comped (free grant)</option>
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Notes
        <input name="notes" placeholder="NEFT ref / reason" style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save subscription'}
      </button>
    </form>
  );
}
