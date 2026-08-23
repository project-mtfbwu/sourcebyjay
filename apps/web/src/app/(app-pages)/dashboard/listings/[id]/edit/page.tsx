import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLoggedInUserId } from '@/data/user/user';
import { getMyListingById } from '@/data/user/listings';
import { getMySupplier } from '@/data/user/profile';
import { getCategories } from '@/data/anon/marketplace';
import { ListingForm } from '@/components/marketplace/dashboard/ListingForm';
import { Button } from '@/components/ui/button';

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const userId = await getLoggedInUserId();
  const supplier = await getMySupplier(userId);

  if (!supplier) {
    redirect('/dashboard/profile');
  }

  const listing = await getMyListingById(userId, id);
  if (!listing) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit listing</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/products/${listing.slug}`} target="_blank">Preview</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/listings">Back</Link>
          </Button>
        </div>
      </div>
      <ListingForm categories={categories} listing={listing} />
    </div>
  );
}
