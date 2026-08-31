import Link from 'next/link';
import { canAccessPortal } from '@sourcebyjay/auth';
import { getSessionProfile } from '@/lib/session';
import { VendorDenied, VendorShell } from '@/components/VendorShell';

export async function VendorAuthenticated({
  children,
  title,
  subtitle,
  hideHeader,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}) {
  const { user, profile, supplier } = await getSessionProfile();
  const allowed = canAccessPortal('vendor', profile?.role ?? null);

  if (!user) {
    return (
      <main className="shell">
        <h1>Seller Central</h1>
        <p className="muted">Sign in to manage listings, quotes, and orders.</p>
        <div className="card" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="btn" href="/login">
            Seller login
          </Link>
          <Link className="btn btn-secondary" href="/signup">
            Create seller account
          </Link>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <VendorDenied
        message={`You are signed in as a ${profile?.role ?? 'buyer'} account. Seller tools need a separate seller signup.`}
      />
    );
  }

  return (
    <VendorShell
      email={profile?.email}
      companyName={profile?.companyName ?? (supplier?.name as string | undefined)}
      verificationTier={(supplier?.verification_tier as string) ?? 'none'}
      title={title}
      subtitle={subtitle}
      hideHeader={hideHeader}
    >
      {children}
    </VendorShell>
  );
}
