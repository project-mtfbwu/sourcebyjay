'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  fakeMarkOrderPaidAction,
  opsReleaseEscrowAction,
  opsReturnEscrowAction,
  opsUpdateOrderStatusAction,
} from '@/lib/order-actions';

export function OpsOrderActions({
  orderId,
  status,
  paymentStatus,
  escrowStatus,
}: {
  orderId: string;
  status: string;
  paymentStatus: string | null;
  escrowStatus: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canFakePay =
    paymentStatus === 'pending' &&
    ['awaiting_payment', 'pending_confirmation', 'confirmed'].includes(status);

  const canRelease = escrowStatus === 'held';
  const canReturn = escrowStatus === 'held' || escrowStatus === 'disputed';

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? 'Failed');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {canFakePay ? (
        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={() => run(() => fakeMarkOrderPaidAction(orderId))}
        >
          {pending ? '…' : 'Mark paid (test)'}
        </button>
      ) : null}
      {status === 'paid' ? (
        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={() => run(() => opsUpdateOrderStatusAction(orderId, 'in_production'))}
        >
          Start production
        </button>
      ) : null}
      {canRelease ? (
        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={() => run(() => opsReleaseEscrowAction(orderId))}
        >
          Release escrow → seller
        </button>
      ) : null}
      {canReturn ? (
        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={() => run(() => opsReturnEscrowAction(orderId))}
        >
          Return escrow → buyer
        </button>
      ) : null}
      {error ? <p className="denied">{error}</p> : null}
    </div>
  );
}
