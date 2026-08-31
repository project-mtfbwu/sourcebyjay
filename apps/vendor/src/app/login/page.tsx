import Link from 'next/link';
import { SellerLoginForm } from '@/components/SellerLoginForm';

const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';

export default function VendorLoginPage() {
  return (
    <main className="shell">
      <h1>Seller login</h1>
      <p className="muted">
        Seller profiles only. Buyer accounts use <a href={`${buyerUrl}/login`}>the buyer site</a>.
      </p>
      <SellerLoginForm />
      <p className="muted" style={{ marginTop: '1.5rem' }}>
        New supplier? <Link href="/signup">Create a seller account</Link>
      </p>
    </main>
  );
}
