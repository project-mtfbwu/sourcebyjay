'use client';

import { useTransition } from 'react';
import { fakeTopUpAdWalletAction } from '@/lib/ad-actions';

export function AdWalletTopUpButton({ amountInr = 500 }: { amountInr?: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await fakeTopUpAdWalletAction(Math.round(amountInr * 100));
          if (!result.ok) alert(result.error);
          else window.location.reload();
        })
      }
    >
      {pending ? 'Adding…' : `Add ₹${amountInr.toLocaleString('en-IN')} test credit`}
    </button>
  );
}
