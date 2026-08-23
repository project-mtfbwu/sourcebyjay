import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLoggedInUserId } from '@/data/user/user';
import { getMySupplier } from '@/data/user/profile';
import { getCategories } from '@/data/anon/marketplace';
import { ListingForm } from '@/components/marketplace/dashboard/ListingForm';
import { Button } from '@/components/ui/button';

export default async function NewListingPage() {
  const userId = await getLoggedInUserId();
  const supplier = await getMySupplier(userId);

  if (!supplier) {
    redirect('/dashboard/profile');
  }

  const categories = await getCategories();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create listing</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/listings">Back to listings</Link>
        </Button>
      </div>
      <ListingForm categories={categories} />
    </div>
  );
}
