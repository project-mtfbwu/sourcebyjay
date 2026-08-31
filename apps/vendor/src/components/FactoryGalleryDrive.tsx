'use client';

import { useState } from 'react';
import type { SupplierVideoPlanFeatures } from '@/lib/plan-features';
import {
  SupplierFileBrowser,
  type BrowserAsset,
} from '@/components/SupplierFileBrowser';

export type GalleryItem = {
  id: string;
  imageUrl: string;
  videoUrl: string | null;
  caption: string | null;
  mediaType: string;
  contentKind: 'image' | 'video';
  status: string;
  createdAt: string;
};

const MEDIA_TYPES = [
  { value: 'factory', label: 'Factory floor' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'team', label: 'Team / QC walkthrough' },
] as const;

/**
 * Factory gallery — upload + Finder/Drive browser on this page only.
 */
export function FactoryGalleryDrive({
  plan,
  items,
}: {
  plan: SupplierVideoPlanFeatures;
  items: GalleryItem[];
}) {
  const [mediaType, setMediaType] = useState('factory');
  const [caption, setCaption] = useState('');
  const canUploadVideos = (plan.videoSlots ?? 0) > 0;
  const videoSlots = plan.videoSlots ?? 0;
  const videoUsed = items.filter(
    (i) => i.contentKind === 'video' && (i.status === 'pending' || i.status === 'approved'),
  ).length;

  const assets: BrowserAsset[] = items.map((i) => ({
    id: i.id,
    publicUrl: i.contentKind === 'video' ? (i.videoUrl ?? i.imageUrl) : i.imageUrl,
    contentKind: i.contentKind,
    caption: i.caption ?? `${i.mediaType} · ${i.status}`,
    folderId: null,
    folderName: i.contentKind === 'video' ? 'Videos' : 'Photos',
    status: i.status,
    createdAt: i.createdAt,
  }));

  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem' }}>Factory storefront media</h2>
        <p className="muted" style={{ margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
          Upload and manage photos/videos <strong>here</strong> (grid, list, preview, folders). Ops must approve
          before buyers see them.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <label style={{ display: 'block', fontSize: '0.9rem' }}>
            Tour type (for next upload)
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            >
              {MEDIA_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', fontSize: '0.9rem' }}>
            Caption (for next upload)
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="CNC line / QC walk…"
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
          {canUploadVideos
            ? `Videos allowed · ${videoUsed}/${videoSlots} slots used. Open Photos or Videos folder, then use Upload in the toolbar.`
            : 'Photos only on your plan. Upgrade to Business+ for factory videos.'}
        </p>
      </div>

      <SupplierFileBrowser
        mode="factory"
        assets={assets}
        height={520}
        showCreateFolder={false}
        factoryMediaType={mediaType}
        factoryCaption={caption}
      />
    </div>
  );
}
