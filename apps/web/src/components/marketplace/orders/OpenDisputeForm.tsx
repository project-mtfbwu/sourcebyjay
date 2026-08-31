'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { openOrderDisputeAction } from '@/data/user/orders';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const REASONS = [
  { value: 'quality_mismatch', label: 'Quality does not match agreed specs' },
  { value: 'not_shipped', label: 'Not shipped on time' },
  { value: 'wrong_quantity', label: 'Wrong quantity' },
  { value: 'damaged', label: 'Damaged in transit' },
  { value: 'non_delivery', label: 'Non-delivery' },
  { value: 'gst_invoice', label: 'GST / invoice issue' },
  { value: 'other', label: 'Other' },
] as const;

export function OpenDisputeForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('quality_mismatch');
  const [note, setNote] = useState('');
  const action = useAction(openOrderDisputeAction, {
    onSuccess: ({ data }) => {
      if (data?.disputeId) {
        router.push(`/account/orders/${orderId}/dispute`);
        router.refresh();
      }
    },
  });

  return (
    <form
      className="mt-3 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        action.execute({ orderId, reason, buyerNote: note || undefined });
      }}
    >
      <p className="text-sm font-medium text-emerald-950">Open a SourceByJay Guarantee dispute</p>
      <div>
        <Label htmlFor="dispute-reason">Reason</Label>
        <select
          id="dispute-reason"
          className="mt-1 w-full rounded-md border bg-white px-2 py-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="dispute-note">Details (optional)</Label>
        <textarea
          id="dispute-note"
          className="mt-1 w-full rounded-md border bg-white px-2 py-2 text-sm"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
        />
      </div>
      <Button type="submit" size="sm" disabled={action.status === 'executing'}>
        {action.status === 'executing' ? 'Opening…' : 'Open dispute'}
      </Button>
      {action.result.serverError ? (
        <p className="text-sm text-destructive">{action.result.serverError}</p>
      ) : null}
    </form>
  );
}
