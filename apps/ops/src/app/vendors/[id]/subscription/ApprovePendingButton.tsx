'use client';

import { useTransition } from 'react';
import { approvePendingPlanAction } from '@/lib/plan-actions';

export function ApprovePendingButton({ supplierId }: { supplierId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn"
      style={{ marginTop: '0.75rem' }}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await approvePendingPlanAction(supplierId);
          if (!result.ok) alert(result.error);
          else window.location.reload();
        });
      }}
    >
      {pending ? 'Approving…' : 'Approve pending plan'}
    </button>
  );
}
