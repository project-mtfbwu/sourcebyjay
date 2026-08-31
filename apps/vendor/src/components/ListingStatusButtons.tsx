'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setListingStatusAction } from '@/lib/listing-actions';

export function ListingStatusButtons({
  listingId,
  status,
}: {
  listingId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: 'draft' | 'published' | 'archived') {
    startTransition(async () => {
      const result = await setListingStatusAction(listingId, next);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {status !== 'published' ? (
        <button className="btn" type="button" disabled={pending} onClick={() => setStatus('published')}>
          Publish
        </button>
      ) : (
        <button className="btn" type="button" disabled={pending} onClick={() => setStatus('draft')}>
          Unpublish
        </button>
      )}
      {status !== 'archived' ? (
        <button type="button" disabled={pending} onClick={() => setStatus('archived')}>
          Archive
        </button>
      ) : null}
    </div>
  );
}
