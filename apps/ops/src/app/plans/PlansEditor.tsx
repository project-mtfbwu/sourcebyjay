'use client';

import { useTransition } from 'react';
import { updateListingPlanAction } from '@/lib/plan-actions';

type Row = {
  id: string;
  slug: string;
  name: string;
  priceInrCentsAnnual: number;
  maxListings: number | null;
  rankBoostBps: number;
  rfqLeadsPerWeek: number;
  guaranteeEligible: boolean;
  active: boolean;
  priceLabel: string;
};

export function PlansEditor({ rows, canEdit }: { rows: Row[]; canEdit: boolean }) {
  const [pending, startTransition] = useTransition();

  function save(row: Row, form: HTMLFormElement) {
    const fd = new FormData(form);
    const maxRaw = String(fd.get('maxListings') ?? '');
    startTransition(async () => {
      const result = await updateListingPlanAction({
        id: row.id,
        priceInrCentsAnnual: Number(fd.get('priceInr') ?? 0) * 100,
        maxListings: maxRaw === '' || maxRaw === 'unlimited' ? null : Number(maxRaw),
        rankBoostBps: Number(fd.get('rankBoostBps') ?? 0),
        rfqLeadsPerWeek: Number(fd.get('rfqLeads') ?? 0),
        guaranteeEligible: fd.get('guarantee') === 'on',
        active: fd.get('active') === 'on',
      });
      if (!result.ok) alert(result.error);
    });
  }

  return (
    <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
      {rows.map((row) => (
        <form
          key={row.id}
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canEdit) return;
            save(row, e.currentTarget);
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {row.name} <span className="muted">({row.slug})</span>
          </h2>
          <div className="form-grid" style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
            <label>
              Price ₹/yr
              <input
                name="priceInr"
                type="number"
                defaultValue={Math.round(row.priceInrCentsAnnual / 100)}
                disabled={!canEdit || pending}
              />
            </label>
            <label>
              Max listings (blank = ∞)
              <input
                name="maxListings"
                type="number"
                defaultValue={row.maxListings ?? ''}
                disabled={!canEdit || pending}
                placeholder="unlimited"
              />
            </label>
            <label>
              Rank boost bps
              <input
                name="rankBoostBps"
                type="number"
                defaultValue={row.rankBoostBps}
                disabled={!canEdit || pending}
              />
            </label>
            <label>
              RFQ leads / week
              <input
                name="rfqLeads"
                type="number"
                defaultValue={row.rfqLeadsPerWeek}
                disabled={!canEdit || pending}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input name="guarantee" type="checkbox" defaultChecked={row.guaranteeEligible} disabled={!canEdit || pending} />
              Guarantee
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input name="active" type="checkbox" defaultChecked={row.active} disabled={!canEdit || pending} />
              Active
            </label>
          </div>
          {canEdit ? (
            <button className="btn" type="submit" disabled={pending} style={{ marginTop: '1rem' }}>
              {pending ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <p className="muted" style={{ marginTop: '0.75rem' }}>
              Current: {row.priceLabel}
            </p>
          )}
        </form>
      ))}
    </div>
  );
}
