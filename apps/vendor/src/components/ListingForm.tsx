'use client';

import { useActionState } from 'react';
import { GST_RATE_BPS_OPTIONS, gstRateLabel } from '@sourcebyjay/types';
import { createListingAction, updateListingAction } from '@/lib/listing-actions';

type Category = { id: string; name: string };

type ListingDefaults = {
  id?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  price?: number;
  currency?: string;
  moq?: number;
  unit?: string;
  imageUrl?: string;
  status?: string;
  sampleAvailable?: boolean;
  leadTimeDays?: number | null;
  hsnCode?: string | null;
  gstRateBps?: number | null;
};

export function ListingForm({
  categories,
  defaults,
  mode,
}: {
  categories: Category[];
  defaults?: ListingDefaults;
  mode: 'create' | 'edit';
}) {
  const action = mode === 'create' ? createListingAction : updateListingAction;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="card" style={{ marginTop: '1rem' }}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      {/* ... fields unchanged until image URL ... */}
      <label>
        Title
        <input name="title" required defaultValue={defaults?.title ?? ''} minLength={3} />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Description
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={defaults?.description ?? ''}
          minLength={10}
        />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Category
        <select name="categoryId" required defaultValue={defaults?.categoryId ?? ''}>
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
        <label>
          Price
          <input name="price" type="number" step="0.01" min="0.01" required defaultValue={defaults?.price ?? ''} />
        </label>
        <label>
          Currency
          <select name="currency" defaultValue={defaults?.currency ?? 'INR'}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label>
          MOQ
          <input name="moq" type="number" min={1} required defaultValue={defaults?.moq ?? 1} />
        </label>
        <label>
          Unit
          <input name="unit" defaultValue={defaults?.unit ?? 'piece'} />
        </label>
        <label>
          Lead time (days)
          <input name="leadTimeDays" type="number" min={0} defaultValue={defaults?.leadTimeDays ?? ''} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={defaults?.status ?? 'draft'}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', marginTop: '1rem' }}>
        <legend style={{ fontSize: '0.85rem', padding: '0 0.25rem' }}>India tax (IndiaMART)</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label>
            HSN code
            <input name="hsnCode" defaultValue={defaults?.hsnCode ?? ''} placeholder="85183000" />
          </label>
          <label>
            GST slab
            <select name="gstRateBps" defaultValue={defaults?.gstRateBps ?? ''}>
              <option value="">—</option>
              {GST_RATE_BPS_OPTIONS.map((bps) => (
                <option key={bps} value={bps}>
                  {gstRateLabel(bps)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>
      {mode === 'edit' ? (
        <input type="hidden" name="imageUrl" value={defaults?.imageUrl ?? ''} />
      ) : (
        <>
          <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
            After creating, open Edit listing — upload photos/videos <strong>on that page</strong> (up to 7) without
            leaving.
          </p>
          <label style={{ display: 'block', marginTop: '0.75rem' }}>
            Placeholder image URL (temporary until you add gallery media on Edit)
            <input name="imageUrl" type="url" required placeholder="https://…" defaultValue={defaults?.imageUrl ?? ''} />
          </label>
        </>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
        <input name="sampleAvailable" type="checkbox" defaultChecked={defaults?.sampleAvailable ?? false} />
        Sample available (buyer can request on PDP)
      </label>
      {state?.error ? <p className="denied" style={{ marginTop: '1rem' }}>{state.error}</p> : null}
      <button className="btn" type="submit" disabled={pending} style={{ marginTop: '1.25rem' }}>
        {pending ? 'Saving…' : mode === 'create' ? 'Create listing' : 'Save listing'}
      </button>
    </form>
  );
}
