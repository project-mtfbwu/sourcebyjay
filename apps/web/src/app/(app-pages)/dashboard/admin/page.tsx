import { redirect } from 'next/navigation';
import { getLoggedInUserId } from '@/data/user/user';
import { getMyProfile } from '@/data/user/profile';
import { getAllSuppliersAdmin } from '@/data/user/admin';
import { AdminSuppliersTable } from '@/components/marketplace/dashboard/AdminSuppliersTable';

export default async function AdminPage() {
  const userId = await getLoggedInUserId();
  const profile = await getMyProfile(userId);

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const suppliers = await getAllSuppliersAdmin();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin — Supplier verification</h1>
        <p className="text-sm text-muted-foreground">
          Approve sellers to show the verified badge on their profile and listings.
        </p>
      </div>
      <AdminSuppliersTable suppliers={suppliers} />
    </div>
  );
}
