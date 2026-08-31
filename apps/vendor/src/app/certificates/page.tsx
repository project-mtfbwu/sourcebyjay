import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { CertificateUploadForm } from '@/components/CertificateUploadForm';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function VendorCertificatesPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Certificates" subtitle="ISO, CE, BIS — verified supplier trust.">
        <div className="card denied">
          <Link href="/login">Sign in</Link> as a seller to manage certificates.
        </div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('supplier_certificates')
    .select('id, name, cert_type, cert_number, issuing_authority, expires_at, status, created_at, file_url')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false });

  return (
    <VendorAuthenticated
      title="Product certificates"
      subtitle="ISO, CE, BIS, RoHS — Alibaba Verified Supplier pattern. Only approved certs show on your public profile."
    >
      <CertificateUploadForm />
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {(rows ?? []).map((row) => (
          <li key={row.id} className="card" style={{ marginBottom: '0.75rem' }}>
            <strong>{row.name}</strong>
            <span style={{ marginLeft: 8, color: '#c2410c' }}>{row.cert_type}</span>
            <p className="muted" style={{ margin: '0.35rem 0', fontSize: '0.85rem' }}>
              {row.status}
              {row.cert_number ? ` · #${row.cert_number}` : ''}
              {row.issuing_authority ? ` · ${row.issuing_authority}` : ''}
              {row.expires_at ? ` · expires ${row.expires_at}` : ''}
            </p>
            <a href={row.file_url as string} target="_blank" rel="noreferrer" className="muted">
              View file
            </a>
          </li>
        ))}
      </ul>
    </VendorAuthenticated>
  );
}
