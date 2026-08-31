import Link from 'next/link';
import { SellerSignUpForm } from '@/components/SellerSignUpForm';
import { getFormFieldConfigs } from '@/lib/form-fields';

const buyerUrl = process.env.NEXT_PUBLIC_BUYER_URL ?? 'http://localhost:3000';

export default async function VendorSignUpPage() {
  const fieldConfigs = await getFormFieldConfigs('seller');

  return (
    <main className="shell">
      <h1>SourceByJay Seller</h1>
      <p className="muted">
        Supplier registration — not the buyer site.{' '}
        <Link href="/login">Already have a seller login?</Link>
      </p>
      <SellerSignUpForm fieldConfigs={fieldConfigs} />
      <p className="muted" style={{ marginTop: '1.5rem' }}>
        Looking to buy? <a href={buyerUrl}>Go to buyer storefront</a>
      </p>
    </main>
  );
}
