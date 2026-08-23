'use client';

import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types/marketplace';
import { deleteListingAction, updateListingStatusAction } from '@/data/user/listings';

export function ListingsTable({ listings }: { listings: Product[] }) {
  const router = useRouter();

  const { execute: updateStatus } = useAction(updateListingStatusAction, {
    onSuccess: () => {
      toast.success('Status updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Update failed'),
  });

  const { execute: deleteListing } = useAction(deleteListingAction, {
    onSuccess: () => {
      toast.success('Listing deleted');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Delete failed'),
  });

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border p-12 text-center">
        <p className="text-lg font-medium">No listings yet</p>
        <p className="mt-2 text-sm text-muted-foreground">Create your first product listing to start selling.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/listings/new">Create listing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Price</th>
            <th className="p-3">MOQ</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id} className="border-t">
              <td className="p-3 font-medium">{listing.title}</td>
              <td className="p-3">${listing.price}</td>
              <td className="p-3">{listing.moq}</td>
              <td className="p-3">
                <Badge variant={listing.status === 'published' ? 'default' : 'secondary'}>
                  {listing.status}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>Edit</Link>
                  </Button>
                  {listing.status !== 'published' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus({ id: listing.id, status: 'published' })}
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteListing({ id: listing.id })}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
