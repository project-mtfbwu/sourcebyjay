import { redirect } from 'next/navigation';
import { getLoggedInUserId } from '@/data/user/user';
import { getMyProfile } from '@/data/user/profile';
import { getAllSuppliersAdmin, getPendingGalleryAdmin } from '@/data/user/admin';
import { AdminSuppliersTable } from '@/components/marketplace/dashboard/AdminSuppliersTable';
import { AdminGalleryQueue } from '@/components/marketplace/dashboard/AdminGalleryQueue';

export default async function AdminSuppliersPage() {
  const userId = await getLoggedInUserId();
  const profile = await getMyProfile(userId);

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const [suppliers, galleryPending] = await Promise.all([
    getAllSuppliersAdmin(),
    getPendingGalleryAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin — Supplier trust & media</h1>
        <p className="text-sm text-muted-foreground">
          Set verification tiers (Gold, Verified) and approve factory gallery images before they go
          public.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Verification tiers</h2>
        <AdminSuppliersTable suppliers={suppliers} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Gallery approval queue</h2>
        <AdminGalleryQueue items={galleryPending} />
      </section>
    </div>
  );
}
