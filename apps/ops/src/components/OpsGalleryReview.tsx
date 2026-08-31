'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moderateGalleryAction } from '@/lib/auth-actions';

type GalleryRow = {
  id: string;
  image_url: string;
  video_url: string | null;
  caption: string | null;
  media_type: string;
  content_kind: string;
  status: string;
  staff_note: string | null;
  created_at: string;
};

type LibraryRow = {
  id: string;
  public_url: string;
  thumbnail_url: string | null;
  content_kind: string;
  caption: string | null;
  status: string;
  staff_note: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged',
  archived: 'Archived',
};

export function OpsGalleryReview({
  items,
  libraryItems = [],
}: {
  items: GalleryRow[];
  libraryItems?: LibraryRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [note, setNote] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'photo') return items.filter((i) => i.content_kind !== 'video');
    if (filter === 'video') return items.filter((i) => i.content_kind === 'video');
    return items;
  }, [filter, items]);

  function act(
    table: 'supplier_gallery' | 'supplier_media_assets',
    id: string,
    status: 'approved' | 'rejected' | 'flagged' | 'archived' | 'pending',
  ) {
    startTransition(async () => {
      const result = await moderateGalleryAction(table, id, status, note.trim() || undefined);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setNote('');
      router.refresh();
    });
  }

  function renderActions(table: 'supplier_gallery' | 'supplier_media_assets', id: string, status: string) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        {status === 'pending' ? (
          <>
            <button className="btn" type="button" disabled={pending} onClick={() => act(table, id, 'approved')}>
              Approve
            </button>
            <button type="button" disabled={pending} onClick={() => act(table, id, 'rejected')}>
              Reject
            </button>
          </>
        ) : null}
        {status !== 'flagged' ? (
          <button type="button" disabled={pending} onClick={() => act(table, id, 'flagged')}>
            Flag
          </button>
        ) : null}
        {status !== 'archived' ? (
          <button type="button" disabled={pending} onClick={() => act(table, id, 'archived')}>
            Archive
          </button>
        ) : null}
        {status === 'flagged' || status === 'archived' || status === 'rejected' ? (
          <button type="button" disabled={pending} onClick={() => act(table, id, 'pending')}>
            Restore to queue
          </button>
        ) : null}
        {status === 'approved' ? (
          <button type="button" disabled={pending} onClick={() => act(table, id, 'rejected')}>
            Reject
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Staff note (optional — saved on flag/archive/reject)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Copyright concern, not a factory, etc."
          style={{ display: 'block', width: '100%', marginTop: '0.25rem' }}
        />
      </label>

      <h3 style={{ marginTop: '1.5rem' }}>Factory gallery queue</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['all', 'photo', 'video'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`btn${filter === f ? '' : ' secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'photo' ? 'Photos' : 'Videos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="muted">No {filter === 'all' ? 'gallery' : filter} items for this vendor.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filtered.map((item) => {
            const isVideo = item.content_kind === 'video';
            const preview = item.video_url ?? item.image_url;
            return (
              <li key={item.id} className="card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {isVideo ? (
                    <video
                      src={preview}
                      controls
                      playsInline
                      preload="metadata"
                      style={{
                        width: 200,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: '#000',
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.caption ?? item.media_type}
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong>
                      {item.media_type}
                      {isVideo ? ' · video' : ' · photo'}
                    </strong>
                    <p className="muted" style={{ margin: '0.25rem 0' }}>
                      {STATUS_LABEL[item.status] ?? item.status}
                      {item.caption ? ` · ${item.caption}` : ''}
                    </p>
                    {item.staff_note ? (
                      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>Note: {item.staff_note}</p>
                    ) : null}
                    {renderActions('supplier_gallery', item.id, item.status)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h3 style={{ marginTop: '2rem' }}>Media library (product uploads)</h3>
      <p className="muted" style={{ fontSize: '0.9rem' }}>
        Flag or archive assets — they disappear from product listings and public pages.
      </p>
      {libraryItems.length === 0 ? (
        <p className="muted">No library assets yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {libraryItems.map((item) => {
            const isVideo = item.content_kind === 'video';
            const preview = isVideo ? item.public_url : item.public_url;
            return (
              <li key={item.id} className="card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {isVideo ? (
                    <video
                      src={preview}
                      controls
                      playsInline
                      preload="metadata"
                      style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, background: '#000' }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.public_url} alt="" width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong>{isVideo ? 'Video' : 'Image'}</strong>
                    <p className="muted" style={{ margin: '0.25rem 0' }}>
                      {STATUS_LABEL[item.status] ?? item.status}
                      {item.caption ? ` · ${item.caption}` : ''}
                    </p>
                    {item.staff_note ? (
                      <p style={{ fontSize: '0.85rem' }}>Note: {item.staff_note}</p>
                    ) : null}
                    {renderActions('supplier_media_assets', item.id, item.status)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
