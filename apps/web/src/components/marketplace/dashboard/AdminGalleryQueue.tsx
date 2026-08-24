'use client';

import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reviewGalleryAction } from '@/data/user/admin';

interface GalleryRow {
  id: string;
  image_url: string;
  media_type: string;
  caption?: string | null;
  status: string;
  suppliers?: { name: string; slug: string } | null;
}

export function AdminGalleryQueue({ items }: { items: GalleryRow[] }) {
  const router = useRouter();
  const { execute, status } = useAction(reviewGalleryAction, {
    onSuccess: () => {
      toast.success('Gallery updated');
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Update failed'),
  });

  const pending = items.filter((i) => i.status === 'pending');

  if (pending.length === 0) {
    return (
      <p className="rounded-xl border p-8 text-center text-muted-foreground">
        No pending gallery images — all caught up.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {pending.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border">
          <div className="relative aspect-video bg-muted">
            <Image src={item.image_url} alt="" fill className="object-cover" sizes="400px" />
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{item.suppliers?.name ?? 'Supplier'}</p>
              <Badge variant="secondary">{item.media_type}</Badge>
            </div>
            {item.caption && <p className="text-sm text-muted-foreground">{item.caption}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={status === 'executing'}
                onClick={() => execute({ galleryId: item.id, status: 'approved' })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={status === 'executing'}
                onClick={() => execute({ galleryId: item.id, status: 'rejected' })}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
