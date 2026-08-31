'use client';

import { useTransition } from 'react';
import { opsGrantAdCreditAction } from '@/lib/ad-actions';

export function OpsGrantAdCreditForm({
  suppliers,
}: {
  suppliers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  if (suppliers.length === 0) return null;

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await opsGrantAdCreditAction({
            supplierId: String(fd.get('supplierId') ?? ''),
            amountInr: Number(fd.get('amountInr') ?? 0),
            note: String(fd.get('note') ?? ''),
          });
          if (!result.ok) alert(result.error);
          else window.location.reload();
        });
      }}
    >
      <h2 style={{ marginTop: 0 }}>Grant ad credit (TEST MODE)</h2>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Seller
        <select name="supplierId" required style={{ display: 'block', width: '100%', marginTop: 4 }}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Amount (₹)
        <input name="amountInr" type="number" min={1} defaultValue={500} required style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Note
        <input name="note" defaultValue="Ops promotional ad credit" style={{ display: 'block', width: '100%', marginTop: 4 }} />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Granting…' : 'Grant credit'}
      </button>
    </form>
  );
}

export function OpsPauseCampaignButton({ campaignId }: { campaignId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const { opsPauseAdCampaignAction } = await import('@/lib/ad-actions');
          const result = await opsPauseAdCampaignAction(campaignId);
          if (!result.ok) alert(result.error);
          else window.location.reload();
        })
      }
    >
      {pending ? 'Pausing…' : 'Pause campaign'}
    </button>
  );
}
