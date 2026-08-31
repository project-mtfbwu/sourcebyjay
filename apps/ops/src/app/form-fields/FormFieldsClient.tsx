'use client';

import { useTransition } from 'react';
import { updateFormFieldModeAction } from '@/lib/actions';
import type { FormFieldMode } from '@sourcebyjay/types';

type Row = {
  id: string;
  persona: string;
  fieldKey: string;
  label: string;
  mode: FormFieldMode;
  sortOrder: number;
};

export function FormFieldsClient({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();

  function setMode(id: string, mode: FormFieldMode) {
    startTransition(async () => {
      const result = await updateFormFieldModeAction(id, mode);
      if (!result.ok) alert(result.error);
    });
  }

  const buyers = rows.filter((r) => r.persona === 'buyer');
  const sellers = rows.filter((r) => r.persona === 'seller');

  return (
    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
      <FieldTable title="Buyer signup fields" rows={buyers} pending={pending} onMode={setMode} />
      <FieldTable title="Seller signup fields" rows={sellers} pending={pending} onMode={setMode} />
      <p className="muted">
        Required = must fill. Optional = can skip. Hidden = not shown on signup. Email, password, and
        phone stay locked (phone needed for OTP).
      </p>
    </div>
  );
}

function FieldTable({
  title,
  rows,
  pending,
  onMode,
}: {
  title: string;
  rows: Row[];
  pending: boolean;
  onMode: (id: string, mode: FormFieldMode) => void;
}) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Key</th>
            <th>Mode</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.label}</td>
              <td>
                <code>{r.fieldKey}</code>
              </td>
              <td>
                <select
                  disabled={
                    pending ||
                    r.fieldKey === 'email' ||
                    r.fieldKey === 'password' ||
                    r.fieldKey === 'phone'
                  }
                  value={r.mode}
                  onChange={(e) => onMode(r.id, e.target.value as FormFieldMode)}
                >
                  <option value="required">required</option>
                  <option value="optional">optional</option>
                  <option value="hidden">hidden</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
