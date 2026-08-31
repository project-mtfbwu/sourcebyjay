'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { BrowserAsset } from '@/components/SupplierFileBrowser';
import { MIN_MEDIA_ASSET_BYTES, vendorMediaServeUrl } from '@/lib/media-display-url';

type Props = {
  label: string;
  hint?: string;
  value: string;
  assetId?: string | null;
  disabled?: boolean;
  onPick: (url: string, assetId: string | null) => void;
  assets: BrowserAsset[];
  aspect?: 'banner' | 'logo';
};

function previewSrc(value: string, assetId: string | null | undefined, assets: BrowserAsset[]) {
  if (assetId) return vendorMediaServeUrl(assetId);
  const match = assets.find((a) => a.publicUrl === value);
  if (match) return vendorMediaServeUrl(match.id);
  return value;
}

export function StorefrontMediaField({
  label,
  hint,
  value,
  assetId,
  disabled,
  onPick,
  assets,
  aspect = 'banner',
}: Props) {
  const [brokenIds, setBrokenIds] = useState<Set<string>>(() => new Set());
  const imageAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          a.contentKind === 'image' &&
          a.status !== 'rejected' &&
          (a.fileSizeBytes ?? 0) >= MIN_MEDIA_ASSET_BYTES &&
          !brokenIds.has(a.id),
      ),
    [assets, brokenIds],
  );

  const previewUrl = value ? previewSrc(value, assetId, assets) : '';

  return (
    <div className="storefront-media-field">
      <span className="storefront-field-label">{label}</span>
      {hint ? <p className="muted storefront-field-hint">{hint}</p> : null}
      <div className={`storefront-media-preview storefront-media-preview-${aspect}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" key={previewUrl} />
        ) : (
          <span className="muted">No image selected</span>
        )}
      </div>
      {disabled ? null : (
        <>
          <p className="muted storefront-field-hint" style={{ marginTop: '0.5rem' }}>
            Click a thumbnail below — preview updates instantly. Upload new files in{' '}
            <Link href="/media">Media library</Link>, then refresh this page.
          </p>
          {imageAssets.length === 0 ? (
            <p className="muted" style={{ marginTop: '0.35rem' }}>
              No usable images yet.{' '}
              <Link href="/media" className="btn btn-secondary" style={{ display: 'inline-block', marginTop: '0.35rem' }}>
                Open media library
              </Link>
            </p>
          ) : (
            <div className="storefront-image-grid" role="listbox" aria-label={`${label} options`}>
              {imageAssets.map((asset) => {
                const selected = assetId ? assetId === asset.id : value === asset.publicUrl;
                const thumbSrc = vendorMediaServeUrl(asset.id);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`storefront-image-thumb${selected ? ' is-selected' : ''}`}
                    title={asset.caption ?? 'Select image'}
                    onClick={() => onPick(asset.publicUrl, asset.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbSrc}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={() => setBrokenIds((prev) => new Set(prev).add(asset.id))}
                    />
                  </button>
                );
              })}
            </div>
          )}
          {value ? (
            <div className="storefront-media-actions">
              <button type="button" className="btn btn-secondary" onClick={() => onPick('', null)}>
                Clear
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
