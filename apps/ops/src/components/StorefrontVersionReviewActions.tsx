'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  approveStorefrontVersionAction,
  rejectStorefrontVersionAction,
} from '@/lib/storefront-actions';

export function StorefrontVersionReviewActions({
  versionId,
  supplierId,
  supplierName,
}: {
  versionId: string;
  supplierId: string;
  supplierName: string;
}) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div style={{ display: 'grid', gap: '0.5rem', minWidth: 220 }}>
      <Link href={`/vendors/${supplierId}`}>{supplierName}</Link>
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await approveStorefrontVersionAction(versionId);
            if (res.error) setError(res.error);
            else window.location.reload();
          })
        }
      >
        Approve &amp; publish
      </button>
      <textarea
        rows={2}
        placeholder="Rejection reason for seller"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: '100%', font: 'inherit' }}
      />
      <button
        type="button"
        className="btn btn-secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await rejectStorefrontVersionAction(versionId, notes);
            if (res.error) setError(res.error);
            else window.location.reload();
          })
        }
      >
        Reject
      </button>
      {error ? <span className="denied" style={{ fontSize: '0.85rem' }}>{error}</span> : null}
    </div>
  );
}
