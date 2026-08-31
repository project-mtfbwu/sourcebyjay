import Link from 'next/link';
import { OpsLoginForm } from '@/components/OpsLoginForm';

const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';
const isLocal =
  process.env.NODE_ENV === 'development' ||
  (process.env.NEXT_PUBLIC_SITE_URL ?? '').includes('localhost');

export default function OpsLoginPage() {
  return (
    <main className="shell">
      <h1>Ops login</h1>
      <p className="muted">
        Staff accounts only (must exist in <code>staff_members</code>). Uses a{' '}
        <strong>separate cookie</strong> from buyer/seller so logging in here does not kick you out
        of :3000 or :3001.
      </p>
      {isLocal ? (
        <div className="card" style={{ marginTop: '1rem', background: '#f7faf7' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Local demo staff (dev only)</p>
          <p className="muted" style={{ margin: '0.5rem 0 0' }}>
            Email: <code>staff@sourcebyjay.test</code>
            <br />
            Password: <code>SourceByJay1!</code>
            <br />
            Role: <code>super_admin</code> (full CRM + edits)
            <br />
            <span className="muted">
              Roles ladder: viewer (read) → manager (edit listings/sellers) → admin → super_admin
            </span>
          </p>
        </div>
      ) : null}
      <OpsLoginForm />
      <p className="muted" style={{ marginTop: '1.5rem' }}>
        Buyer accounts use <a href={`${buyerUrl}/login`}>the buyer site</a>.{' '}
        <Link href="/">← Back</Link>
      </p>
    </main>
  );
}
