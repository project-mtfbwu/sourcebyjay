'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createQuoteAction, estimateFreightAction } from '@/lib/actions';

const INCOTERMS = ['EXW', 'FOB', 'CIF', 'CFR', 'DDP', 'DAP'] as const;

export function CreateQuoteForm({
  inquiryId,
  defaultQuantity,
}: {
  inquiryId: string;
  defaultQuantity: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [estimating, startEstimate] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [freightAmount, setFreightAmount] = useState(0);
  const [shippingZone, setShippingZone] = useState<string | null>(null);
  const [estimateNote, setEstimateNote] = useState<string | null>(null);

  return (
    <form
      style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await createQuoteAction({
            inquiryId,
            unitPrice: Number(fd.get('unitPrice')),
            quantity: Number(fd.get('quantity')),
            leadTimeDays: Number(fd.get('leadTimeDays') || 14),
            validUntil: String(fd.get('validUntil') || '') || undefined,
            notes: String(fd.get('notes') || '') || undefined,
            isSample: fd.get('isSample') === 'on',
            incoterm: String(fd.get('incoterm') || 'FOB'),
            freightAmount: Number(fd.get('freightAmount') || 0),
            destinationPincode: String(fd.get('destinationPincode') || '') || undefined,
            estimatedWeightKg: Number(fd.get('estimatedWeightKg') || 0) || undefined,
            shipByDate: String(fd.get('shipByDate') || '') || undefined,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setDone(true);
          router.refresh();
        });
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          Unit ₹
          <input
            name="unitPrice"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={100}
            style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem' }}
          />
        </label>
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          Qty
          <input
            name="quantity"
            type="number"
            min={1}
            required
            defaultValue={defaultQuantity ?? 1}
            style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem' }}
          />
        </label>
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          Lead days
          <input
            name="leadTimeDays"
            type="number"
            min={0}
            defaultValue={14}
            style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem' }}
          />
        </label>
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          Valid until
          <input
            name="validUntil"
            type="date"
            style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem' }}
          />
        </label>
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          Incoterm
          <select
            name="incoterm"
            defaultValue="FOB"
            style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem' }}
          >
            {INCOTERMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          Ship by
          <input
            name="shipByDate"
            type="date"
            style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem' }}
          />
        </label>
      </div>

      <fieldset
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '0.75rem',
          margin: 0,
        }}
      >
        <legend style={{ fontSize: '0.85rem', padding: '0 0.25rem' }}>Freight estimate (India)</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Buyer pincode
            <input
              name="destinationPincode"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 560001"
              maxLength={6}
              style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem', width: 100 }}
            />
          </label>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Weight (kg)
            <input
              name="estimatedWeightKg"
              type="number"
              min={0.1}
              step="0.1"
              defaultValue={5}
              style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem', width: 80 }}
            />
          </label>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Freight ₹
            <input
              name="freightAmount"
              type="number"
              min={0}
              step="1"
              value={freightAmount}
              onChange={(e) => setFreightAmount(Number(e.target.value))}
              style={{ display: 'block', marginTop: 4, padding: '0.35rem 0.5rem', width: 100 }}
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={estimating}
            onClick={(e) => {
              const form = (e.currentTarget as HTMLButtonElement).form;
              if (!form) return;
              const fd = new FormData(form);
              const pincode = String(fd.get('destinationPincode') || '');
              const weight = Number(fd.get('estimatedWeightKg') || 5);
              startEstimate(async () => {
                const result = await estimateFreightAction({ weightKg: weight, pincode });
                if (!result.ok) {
                  setEstimateNote(result.error);
                  return;
                }
                const est = result.estimate;
                setFreightAmount(Number(est.freight_amount ?? 0));
                setShippingZone(est.zone ?? null);
                setEstimateNote(
                  `Zone ${est.zone} · ₹${est.rate_per_kg}/kg (min ₹${est.min_charge})`,
                );
              });
            }}
          >
            {estimating ? 'Estimating…' : 'Get estimate'}
          </button>
        </div>
        {estimateNote ? (
          <p className="muted" style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            {estimateNote}
            {shippingZone ? ` · zone: ${shippingZone}` : ''}
          </p>
        ) : (
          <p className="muted" style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            FOB = buyer arranges port freight; CIF/DDP = include freight in quote. Estimate is a slab
            (not live carrier rates).
          </p>
        )}
      </fieldset>

      <label className="muted" style={{ fontSize: '0.85rem' }}>
        Notes
        <textarea
          name="notes"
          rows={2}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.35rem 0.5rem' }}
        />
      </label>
      <label className="muted" style={{ fontSize: '0.85rem' }}>
        <input name="isSample" type="checkbox" /> Sample order
      </label>
      <button className="btn" type="submit" disabled={pending || done}>
        {done ? 'Quote sent' : pending ? 'Sending…' : 'Send quote'}
      </button>
      {error ? (
        <p className="denied" style={{ margin: 0 }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
