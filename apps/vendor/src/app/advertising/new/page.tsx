import { createClient } from '@/lib/supabase';
import { getSessionProfile } from '@/lib/session';
import { VendorAuthenticated } from '@/components/VendorAuthenticated';
import { AdStudio } from '@/components/AdStudio';

export default async function NewAdCampaignPage() {
  const { supplier } = await getSessionProfile();

  if (!supplier?.id) {
    return (
      <VendorAuthenticated title="Ad Studio" subtitle="Build ads with live placement preview.">
        <div className="card denied">Complete seller signup first.</div>
      </VendorAuthenticated>
    );
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, title, image_url, price, status')
    .eq('supplier_id', supplier.id)
    .eq('status', 'published')
    .order('title');

  return (
    <VendorAuthenticated
      title="Ad Studio"
      subtitle="Build text, image, or video ads — preview placements live before you publish."
    >
      <AdStudio
        supplierName={supplier.name ?? 'Your factory'}
        products={(products ?? []).map((p) => ({
          id: p.id as string,
          title: p.title as string,
          imageUrl: (p.image_url as string | null) ?? null,
          price: p.price != null ? Number(p.price) : null,
        }))}
      />
    </VendorAuthenticated>
  );
}
