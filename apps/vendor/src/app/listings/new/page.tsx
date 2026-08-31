import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { ListingForm } from '@/components/ListingForm';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';

export default async function NewListingPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="New listing" subtitle="Add a product to your storefront.">
        <div className="card denied">
          <Link href="/login">Sign in</Link> with a seller company first.
        </div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <VendorAuthenticated title="New listing" subtitle="Title, pricing, HSN/GST — then Edit to upload gallery on that page.">
      <p className="muted">
        <Link href="/listings">← Back to listings</Link>
      </p>
      <ListingForm categories={categories ?? []} mode="create" />
    </VendorAuthenticated>
  );
}
