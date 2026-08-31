'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  STOREFRONT_DRAFT_MESSAGE,
  STOREFRONT_PREVIEW_READY,
  mainProductsLabelFromCategoryIds,
  type StorefrontCategoryOption,
  type StorefrontDraftPayload,
} from '@sourcebyjay/types';
import { StorefrontFeaturedProducts, type StorefrontCatalogProduct } from '@/components/StorefrontFeaturedProducts';
import { StorefrontMainCategoriesPicker } from '@/components/StorefrontMainCategoriesPicker';
import { StorefrontMediaField } from '@/components/StorefrontMediaField';
import { StorefrontProfileFacts, type StorefrontProfileFacts as ProfileFacts } from '@/components/StorefrontProfileFacts';
import type { BrowserAsset } from '@/components/SupplierFileBrowser';
import {
  createStorefrontVersionAction,
  saveStorefrontDraftAction,
  submitStorefrontForReviewAction,
} from '@/lib/storefront-actions';

export type StorefrontVersionRow = {
  id: string;
  versionNumber: number;
  versionLabel: string | null;
  status: string;
  reviewNotes: string | null;
  updatedAt: string;
};

type Props = {
  slug: string;
  buyerUrl: string;
  customMinisite: boolean;
  profileFacts: ProfileFacts;
  catalogProducts: StorefrontCatalogProduct[];
  categoryOptions: StorefrontCategoryOption[];
  mediaAssets: BrowserAsset[];
  versions: StorefrontVersionRow[];
  editableDraftId: string | null;
  initialVersionId: string | null;
  initialPayload: StorefrontDraftPayload;
  initialStatus: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending ops review',
  rejected: 'Rejected — edit & resubmit',
  published: 'Live',
  superseded: 'Archived',
};

function normalizeOrigin(url: string) {
  return url.replace(/\/$/, '');
}

function isAllowedBuyerOrigin(origin: string, buyerUrl: string) {
  const allowed = new Set([
    normalizeOrigin(buyerUrl),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  if (allowed.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.port === '3000';
  } catch {
    return false;
  }
}

export function StorefrontStudio({
  slug,
  buyerUrl,
  customMinisite,
  profileFacts,
  catalogProducts,
  categoryOptions,
  mediaAssets,
  versions,
  editableDraftId,
  initialVersionId,
  initialPayload,
  initialStatus,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReadyRef = useRef(false);
  const draftRef = useRef(initialPayload);
  const buyerOrigin = normalizeOrigin(buyerUrl);
  const [versionId] = useState<string | null>(initialVersionId);
  const [status] = useState(initialStatus);
  const [draft, setDraft] = useState<StorefrontDraftPayload>(initialPayload);
  const [versionLabel, setVersionLabel] = useState(
    versions.find((v) => v.id === initialVersionId)?.versionLabel ?? '',
  );
  const [previewMode, setPreviewMode] = useState<'marketplace' | 'factory'>(
    customMinisite ? 'factory' : 'marketplace',
  );
  const [previewReady, setPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewReloadNonce, setPreviewReloadNonce] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const readOnly = status === 'pending_review' || status === 'published' || status === 'superseded';

  const previewSrc = useMemo(() => {
    const mode = previewMode === 'factory' && customMinisite ? 'factory' : 'marketplace';
    return `${buyerOrigin}/preview/supplier/${slug}?mode=${mode}`;
  }, [buyerOrigin, slug, previewMode, customMinisite]);

  const postDraftToPreview = useCallback(
    (payload: StorefrontDraftPayload) => {
      let target = buyerOrigin;
      try {
        target = new URL(previewSrc).origin;
      } catch {
        // keep configured buyer origin
      }
      iframeRef.current?.contentWindow?.postMessage(
        { type: STOREFRONT_DRAFT_MESSAGE, payload },
        target,
      );
    },
    [buyerOrigin, previewSrc],
  );

  useEffect(() => {
    previewReadyRef.current = previewReady;
  }, [previewReady]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    setPreviewReady(false);
    setPreviewError(null);
  }, [previewSrc]);

  useEffect(() => {
    if (previewReady) return;
    const timeout = window.setTimeout(() => {
      setPreviewError((prev) =>
        prev ??
        'Preview not responding — open a second terminal, cd to the project folder, run pnpm web#dev, wait for “Ready”, then click Retry. Keep both seller (:3001) and buyer (:3000) running.',
      );
    }, 20_000);
    return () => window.clearTimeout(timeout);
  }, [previewReady, previewSrc]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAllowedBuyerOrigin(event.origin, buyerOrigin)) return;
      if (event.data?.type === STOREFRONT_PREVIEW_READY) {
        setPreviewReady(true);
        setPreviewError(null);
        postDraftToPreview(draftRef.current);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [buyerOrigin, postDraftToPreview]);

  useEffect(() => {
    if (!previewReady) return;
    postDraftToPreview(draft);
  }, [draft, previewReady, postDraftToPreview]);

  function patchMainCategories(ids: string[]) {
    if (readOnly) return;
    const mainProducts = mainProductsLabelFromCategoryIds(ids, categoryOptions);
    setDraft((prev) => {
      const next = { ...prev, mainProductCategoryIds: ids, mainProducts };
      draftRef.current = next;
      if (previewReadyRef.current) {
        postDraftToPreview(next);
      }
      return next;
    });
  }

  function patchDraft(patch: Partial<StorefrontDraftPayload>) {
    if (readOnly) return;
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      draftRef.current = next;
      if (previewReadyRef.current) {
        postDraftToPreview(next);
      }
      return next;
    });
  }

  function loadVersion(id: string) {
    window.location.href = `/storefront?version=${id}`;
  }

  function runAction(
    fn: () => Promise<{ ok?: boolean; error?: string; versionId?: string }>,
    opts?: { reloadOnly?: boolean },
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.versionId && !opts?.reloadOnly) {
        window.location.href = `/storefront?version=${result.versionId}`;
        return;
      }
      setMessage(result.ok ? 'Submitted for ops review.' : 'Saved.');
      window.location.reload();
    });
  }

  const activeVersion = versions.find((v) => v.id === versionId);

  const editableDraft = editableDraftId
    ? versions.find((v) => v.id === editableDraftId)
    : null;

  return (
    <div className="storefront-studio">
      {readOnly ? (
        <div className="storefront-locked-banner card">
          <div>
            <strong>This version is locked</strong>
            <span className="muted">
              {' '}
              — {STATUS_LABEL[status] ?? status}. You can preview it but cannot edit.
            </span>
          </div>
          <div className="storefront-locked-banner-actions">
            {editableDraft && editableDraft.id !== versionId ? (
              <button
                type="button"
                className="btn"
                disabled={pending}
                onClick={() => loadVersion(editableDraft.id)}
              >
                Edit draft (v{editableDraft.versionNumber})
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => runAction(() => createStorefrontVersionAction())}
            >
              New version
            </button>
          </div>
        </div>
      ) : null}

      <div className="storefront-studio-toolbar card">
        <div className="storefront-studio-toolbar-row">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Storefront marketing</h2>
            <p className="muted" style={{ margin: '0.25rem 0 0' }}>
              Banner, logo, featured products, and about text — company legal data stays locked.
              Preview updates live on the right.
            </p>
          </div>
          <div className="storefront-version-meta">
            <label className="version-select-label">
              Version
              <select
                value={versionId ?? ''}
                onChange={(e) => loadVersion(e.target.value)}
                disabled={pending}
              >
                {versions.length === 0 ? (
                  <option value="">New draft (unsaved)</option>
                ) : (
                  versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.versionNumber} — {STATUS_LABEL[v.status] ?? v.status}
                      {v.versionLabel ? ` (${v.versionLabel})` : ''}
                    </option>
                  ))
                )}
              </select>
            </label>
            {activeVersion ? (
              <span className={`version-badge status-${activeVersion.status}`}>
                {STATUS_LABEL[activeVersion.status] ?? activeVersion.status}
              </span>
            ) : null}
          </div>
        </div>

        <div className="storefront-studio-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending || readOnly}
            onClick={() => runAction(() => saveStorefrontDraftAction({ versionId, payload: draft, versionLabel }))}
          >
            Save draft
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => runAction(() => createStorefrontVersionAction())}
          >
            New version
          </button>
          <button
            type="button"
            className="btn"
            disabled={pending || readOnly || !versionId}
            onClick={() =>
              versionId
                ? runAction(() => submitStorefrontForReviewAction(versionId), { reloadOnly: true })
                : undefined
            }
          >
            Submit for review
          </button>
        </div>

        {activeVersion?.reviewNotes && status === 'rejected' ? (
          <p className="denied" style={{ margin: '0.75rem 0 0' }}>
            Ops feedback: {activeVersion.reviewNotes}
          </p>
        ) : null}
        {error ? <p className="denied">{error}</p> : null}
        {message ? <p className="save-ok">{message}</p> : null}
      </div>

      <div className="storefront-studio-split">
        <div className="storefront-studio-editor">
          <StorefrontProfileFacts facts={profileFacts} />

          <div className="card" style={{ marginTop: '1rem' }}>
            <fieldset className="form-section" disabled={readOnly}>
              <legend>Version label (optional)</legend>
              <input
                id="storefront-version-label"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="e.g. Diwali 2026 refresh"
                style={{ width: '100%', font: 'inherit', padding: '0.45rem 0.55rem' }}
              />
            </fieldset>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <fieldset className="form-section" disabled={readOnly}>
              <legend>Hero images</legend>
              <StorefrontMediaField
                label="Banner"
                hint="Wide factory or team photo — click a thumbnail below."
                value={draft.bannerUrl}
                assetId={draft.bannerAssetId}
                aspect="banner"
                assets={mediaAssets}
                onPick={(url, assetId) => patchDraft({ bannerUrl: url, bannerAssetId: assetId })}
              />
              <StorefrontMediaField
                label="Logo"
                hint="Square logo on your company card — images only."
                value={draft.logoUrl}
                assetId={draft.logoAssetId}
                aspect="logo"
                assets={mediaAssets}
                onPick={(url, assetId) => patchDraft({ logoUrl: url, logoAssetId: assetId })}
              />
            </fieldset>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <fieldset className="form-section" disabled={readOnly}>
              <legend>Main product lines</legend>
              <StorefrontMainCategoriesPicker
                options={categoryOptions}
                selectedIds={draft.mainProductCategoryIds}
                disabled={readOnly}
                onChange={patchMainCategories}
              />
            </fieldset>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <fieldset className="form-section" disabled={readOnly}>
              <legend>Featured products &amp; sort order</legend>
              <StorefrontFeaturedProducts
                products={catalogProducts}
                selectedIds={draft.featuredProductIds}
                disabled={readOnly}
                onChange={(ids) => patchDraft({ featuredProductIds: ids })}
              />
            </fieldset>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <fieldset className="form-section" disabled={readOnly}>
              <legend>About (marketing description)</legend>
              <label htmlFor="storefront-about" className="storefront-field-label">
                Upgrade your company story for buyers — do not add new legal fields here.
              </label>
              <textarea
                id="storefront-about"
                rows={6}
                value={draft.description}
                onChange={(e) => patchDraft({ description: e.target.value })}
                style={{ width: '100%', font: 'inherit', padding: '0.55rem' }}
              />
            </fieldset>
          </div>

          <p className="muted" style={{ marginTop: '1rem' }}>
            Statutory profile: <Link href="/settings">Company settings</Link> · Plans:{' '}
            <Link href="/plans">Compare plans</Link>
          </p>
        </div>

        <div className="storefront-studio-preview card storefront-studio-preview-sticky">
          <div className="storefront-preview-head">
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>View as buyer</h3>
              <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                {previewReady ? 'Live — like Meta ad preview' : 'Loading preview…'}
              </p>
            </div>
            <div className="preview-mode-toggle">
              <button
                type="button"
                className={previewMode === 'marketplace' ? 'is-active' : ''}
                onClick={() => setPreviewMode('marketplace')}
              >
                Marketplace
              </button>
              {customMinisite ? (
                <button
                  type="button"
                  className={previewMode === 'factory' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('factory')}
                >
                  Factory URL
                </button>
              ) : null}
            </div>
          </div>
          <div className="storefront-preview-stage">
            <div className="storefront-preview-frame-wrap">
              {!previewReady && !previewError ? (
                <div className="storefront-preview-loading">
                  <div className="storefront-preview-loading-bar" />
                  <p>Loading buyer preview…</p>
                </div>
              ) : null}
              {previewError ? (
                <div className="storefront-preview-loading">
                  <p className="denied">{previewError}</p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setPreviewError(null);
                      setPreviewReady(false);
                      setPreviewReloadNonce((n) => n + 1);
                    }}
                  >
                    Retry preview
                  </button>
                </div>
              ) : null}
              <iframe
                key={`${previewSrc}-${previewReloadNonce}`}
                ref={iframeRef}
                title="Storefront buyer preview"
                src={previewSrc}
                className={`storefront-preview-frame${previewReady ? ' is-ready' : ''}`}
                allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
                onLoad={() => {
                  window.setTimeout(() => {
                    if (!previewReadyRef.current) {
                      setPreviewReady(true);
                      setPreviewError(null);
                    }
                    postDraftToPreview(draftRef.current);
                  }, 1200);
                }}
              />
            </div>
          </div>
          <p className="muted" style={{ margin: '0.75rem 0 0', fontSize: '0.82rem' }}>
            Public page:{' '}
            <code>{customMinisite ? `/factory/${slug}` : `/suppliers/${slug}`}</code> until ops
            approves your draft.
          </p>
        </div>
      </div>
    </div>
  );
}
