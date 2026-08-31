'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { saveProductMediaAction } from '@/lib/media-actions';
import { MAX_PRODUCT_MEDIA } from '@/lib/media-storage';
import {
  SupplierFileBrowser,
  type BrowserAsset,
  type BrowserFolder,
} from '@/components/SupplierFileBrowser';

export type LibraryAsset = {
  id: string;
  publicUrl: string;
  contentKind: 'image' | 'video';
  caption: string | null;
  folderId?: string | null;
  createdAt?: string;
  fileSizeBytes?: number | null;
};

function SortableThumb({
  asset,
  onRemove,
}: {
  asset: LibraryAsset;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: asset.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, position: 'relative' }}>
      <div
        {...attributes}
        {...listeners}
        style={{
          width: 72,
          height: 72,
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid var(--accent)',
          cursor: 'grab',
          background: '#111',
        }}
      >
        {asset.contentKind === 'video' ? (
          <video src={asset.publicUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.publicUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(asset.id)}
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: 'none',
          background: '#c00',
          color: '#fff',
          fontSize: 12,
          cursor: 'pointer',
        }}
        aria-label="Remove"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Listing product gallery — upload + browse + pick on THIS page (Finder/Drive browser).
 * Does not send the seller to /media.
 */
export function ProductMediaPicker({
  productId,
  folders,
  libraryAssets,
  initialSelectedIds,
}: {
  productId: string;
  folders: BrowserFolder[];
  libraryAssets: LibraryAsset[];
  initialSelectedIds: string[];
}) {
  const [assets, setAssets] = useState(libraryAssets);
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingSelect, setPendingSelect] = useState<string[]>([]);

  useEffect(() => {
    setAssets(libraryAssets);
  }, [libraryAssets]);

  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [initialSelectedIds]);

  const selectedAssets = useMemo(
    () => selectedIds.map((id) => assets.find((a) => a.id === id)).filter(Boolean) as LibraryAsset[],
    [selectedIds, assets],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelectedIds((ids) => {
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      return arrayMove(ids, oldIndex, newIndex);
    });
  }, []);

  function addIds(ids: string[]) {
    setSelectedIds((prev) => {
      const next = [...prev];
      for (const id of ids) {
        if (next.includes(id)) continue;
        if (next.length >= MAX_PRODUCT_MEDIA) {
          setMessage(`Maximum ${MAX_PRODUCT_MEDIA} items per listing.`);
          break;
        }
        next.push(id);
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const result = await saveProductMediaAction(productId, selectedIds);
    setSaving(false);
    if (result.error) setMessage(result.error);
    else setMessage('Listing media saved — buyers will see this gallery.');
  }

  const browserAssets: BrowserAsset[] = assets.map((a) => ({
    id: a.id,
    publicUrl: a.publicUrl,
    contentKind: a.contentKind,
    caption: a.caption,
    folderId: a.folderId ?? null,
    createdAt: a.createdAt ?? new Date().toISOString(),
    fileSizeBytes: a.fileSizeBytes ?? null,
  }));

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem' }}>
        Product gallery (up to {MAX_PRODUCT_MEDIA})
      </h2>
      <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.85rem' }}>
        Upload and browse <strong>on this page</strong> — select files → Add to gallery → drag to reorder → Save.
      </p>

      {selectedAssets.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={selectedIds} strategy={horizontalListSortingStrategy}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {selectedAssets.map((asset) => (
                <SortableThumb
                  key={asset.id}
                  asset={asset}
                  onRemove={(id) => setSelectedIds((p) => p.filter((x) => x !== id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          No gallery items yet — upload below, then add to gallery.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          className="btn"
          disabled={pendingSelect.length === 0}
          onClick={() => {
            addIds(pendingSelect);
            setMessage(
              pendingSelect.length
                ? `Added ${pendingSelect.length} file(s) to listing gallery.`
                : 'Select files in the browser first (not folders).',
            );
          }}
        >
          Add selected to gallery ({pendingSelect.length})
        </button>
        <button
          type="button"
          className="btn"
          disabled={saving || selectedIds.length === 0}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save listing media'}
        </button>
      </div>

      {message ? <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>{message}</p> : null}

      <SupplierFileBrowser
        mode="library"
        folders={folders}
        assets={browserAssets}
        height={440}
        showCreateFolder
        onSelectionChange={setPendingSelect}
      />
    </div>
  );
}
