import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { getOpsSession } from '@/lib/session';
import { OpsDenied, OpsShell } from '@/components/OpsShell';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpsVendorVerificationPage({ params }: PageProps) {
  const { id } = await params;
  const { profile, staff } = await getOpsSession();
  if (!canAccessPortal('ops', profile?.role ?? null, staff?.role ?? null)) {
    return <OpsDenied />;
  }

  const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';

  return (
    <OpsShell
      email={profile?.email}
      staffRole={staff?.role}
      title="Verification"
      subtitle="Gold / verified tier workflow"
    >
      <p style={{ marginTop: 0 }}>
        <Link href={`/vendors/${id}`}>← Seller</Link>
      </p>
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>
          Temporary bridge to buyer admin until actions move fully here:{' '}
          <a href={`${buyerUrl}/dashboard/admin/suppliers`}>legacy admin queue</a>
        </p>
      </div>
    </OpsShell>
  );
}
