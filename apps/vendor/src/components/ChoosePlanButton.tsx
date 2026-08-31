'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { requestVendorPlanAction } from '@/lib/actions';

export function ChoosePlanButton({
  planId,
  planName,
  isCurrent,
  isPendingRequest,
  isFree,
}: {
  planId: string;
  planName: string;
  isCurrent: boolean;
  isPendingRequest: boolean;
  isFree: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isCurrent) {
    return <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>Current plan</p>;
  }

  if (isPendingRequest) {
    return (
      <p style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>
        Requested — waiting for ops
      </p>
    );
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() => {
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const result = await requestVendorPlanAction(planId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (result.mode === 'pending') {
              setMessage(result.message ?? `Requested ${planName}. Ops will confirm after payment.`);
            } else if (result.mode === 'activated') {
              setMessage(`${planName} is now active.`);
            } else if (result.mode === 'already_active') {
              setMessage('You are already on this plan.');
            } else {
              setMessage('Done.');
            }
            router.refresh();
          });
        }}
      >
        {pending ? 'Saving…' : isFree ? `Switch to ${planName}` : `Choose ${planName}`}
      </button>
      {!isFree ? (
        <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
          Paid plans: you choose now; ops activates after payment (Stripe later).
        </p>
      ) : null}
      {message ? <p style={{ marginTop: '0.5rem' }}>{message}</p> : null}
      {error ? (
        <p className="denied" style={{ marginTop: '0.5rem' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
