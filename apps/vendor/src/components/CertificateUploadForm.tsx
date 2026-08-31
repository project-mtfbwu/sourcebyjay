'use client';

import { useActionState } from 'react';
import { CERT_TYPE_OPTIONS } from '@sourcebyjay/types';
import { uploadCertificateAction } from '@/lib/listing-actions';

export function CertificateUploadForm() {
  const [state, formAction, pending] = useActionState(uploadCertificateAction, null);

  return (
    <form action={formAction} className="card" style={{ marginTop: '1rem' }}>
      <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Upload certificate</h2>
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        Alibaba-style: ISO, CE, BIS, RoHS — include certificate number and issuer. Ops approves before
        public display.
      </p>
      <label>
        Certificate name
        <input name="name" required placeholder="ISO 9001:2015" />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Type
        <select name="certType" defaultValue="ISO_9001">
          {CERT_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Certificate number
        <input name="certNumber" placeholder="Reg. / license no." />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Issuing authority
        <input name="issuingAuthority" placeholder="Bureau Veritas, BIS, …" />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Expires (optional)
        <input name="expiresAt" type="date" />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        File (PDF or image)
        <input name="file" type="file" accept="image/*,.pdf" required />
      </label>
      {state?.error ? (
        <p className="denied" style={{ marginTop: '0.75rem' }}>
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p style={{ marginTop: '0.75rem', color: 'var(--accent)' }}>Uploaded — pending ops approval.</p>
      ) : null}
      <button className="btn" type="submit" disabled={pending} style={{ marginTop: '1rem' }}>
        {pending ? 'Uploading…' : 'Upload certificate'}
      </button>
    </form>
  );
}
