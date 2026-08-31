'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '@/lib/actions';

const NEXT: Record<string, { label: string; status: string } | null> = {
  awaiting_payment: { label: 'Confirm order', status: 'confirmed' },
  paid: { label: 'Start production', status: 'in_production' },
  in_production: { label: 'Mark shipped', status: 'shipped' },
  shipped: { label: 'Mark delivered', status: 'delivered' },
  delivered: { label: 'Complete', status: 'completed' },
};

export function OrderStatusButton({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = NEXT[status];

  if (!next) return null;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await updateOrderStatusAction(orderId, next.status);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? 'Updating…' : next.label}
      </button>
      {error ? (
        <p className="denied" style={{ marginTop: '0.35rem' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
