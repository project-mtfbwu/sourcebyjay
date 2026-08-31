'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  ChonkyActions,
  FileBrowser,
  FileContextMenu,
  FileList as ChonkyFileList,
  FileNavbar,
  FileToolbar,
  FileViewMode,
  defineFileAction,
  setChonkyDefaults,
  type FileArray,
  type FileBrowserHandle,
  type FileData,
  type FileActionHandler,
} from 'chonky2';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import {
  createMediaFolderAction,
  deleteMediaAssetAction,
} from '@/lib/media-actions';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  isHeicUploadFile,
  isImageUploadFile,
  isVideoUploadFile,
} from '@/lib/media-storage';

export type BrowserFolder = { id: string; name: string };
export type BrowserAsset = {
  id: string;
  publicUrl: string;
  contentKind: 'image' | 'video';
  caption: string | null;
  folderId: string | null;
  folderName?: string | null;
  status?: string;
  createdAt: string;
  fileSizeBytes?: number | null;
};

const ROOT_ID = 'sbj-root';
const FACTORY_PHOTOS = 'factory-photos';
const FACTORY_VIDEOS = 'factory-videos';
const FOLDER_SIZE_KEY = 'sbj-chonky-folder-icon-size';
const FILE_SIZE_KEY = 'sbj-chonky-file-icon-size';
const LEGACY_SIZE_KEY = 'sbj-chonky-icon-size';
const ICON_SIZE_MIN = 64;
const ICON_SIZE_MAX = 200;
const FOLDER_SIZE_DEFAULT = 84;
const FILE_SIZE_DEFAULT = 110;
const GRID_ACTION_ID = 'sbj_enable_grid_view';

const cuteTheme = createTheme({
  palette: {
    primary: { main: '#5BC93A', contrastText: '#0a1a06' },
    secondary: { main: '#76EE59' },
    background: { default: '#f7fbf4', paper: '#ffffff' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 999 },
      },
    },
  },
});

setChonkyDefaults({
  darkMode: false,
});

function clampIconSize(n: number) {
  return Math.min(ICON_SIZE_MAX, Math.max(ICON_SIZE_MIN, Math.round(n)));
}

function readStoredSize(key: string, fallback: number) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return clampIconSize(Number(raw));
    // migrate old single slider once
    if (key === FOLDER_SIZE_KEY) {
      const legacy = window.localStorage.getItem(LEGACY_SIZE_KEY);
      if (legacy) return clampIconSize(Number(legacy));
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeStoredSize(key: string, size: number) {
  try {
    window.localStorage.setItem(key, String(size));
  } catch {
    /* ignore */
  }
}

function gridEntryHeight(width: number) {
  return Math.round(width * 0.7 + 32);
}

function makeGridSizeAction(iconSize: number) {
  return defineFileAction({
    id: GRID_ACTION_ID,
    fileViewConfig: {
      mode: FileViewMode.Grid,
      entryWidth: iconSize,
      entryHeight: gridEntryHeight(iconSize),
    },
    button: {
      name: 'Switch to Grid view',
      toolbar: true,
      icon: ChonkyActions.EnableGridView.button!.icon,
      iconOnly: true,
    },
  });
}

function folderFile(f: BrowserFolder): FileData {
  return {
    id: f.id,
    name: f.name,
    isDir: true,
    droppable: true,
    color: '#76EE59',
  };
}

function assetFile(a: BrowserAsset): FileData {
  const isVideo = a.contentKind === 'video';
  return {
    id: a.id,
    name: a.caption || (isVideo ? 'Video' : 'Photo'),
    isDir: false,
    size: a.fileSizeBytes ?? undefined,
    modDate: a.createdAt,
    thumbnailUrl: isVideo ? undefined : a.publicUrl,
    color: isVideo ? '#3b82f6' : undefined,
    openable: true,
    selectable: true,
    publicUrl: a.publicUrl,
    contentKind: a.contentKind,
    status: a.status,
  };
}

type BrowserProps = {
  mode: 'library' | 'factory';
  folders?: BrowserFolder[];
  assets: BrowserAsset[];
  height?: number;
  onSelectionChange?: (ids: string[]) => void;
  /** Storefront picker — single-click a file to apply immediately */
  pickOnActivate?: boolean;
  onAssetPick?: (asset: BrowserAsset) => void;
  showCreateFolder?: boolean;
  factoryMediaType?: string;
  factoryCaption?: string;
};

/**
 * Polished Finder-like browser via chonky2.
 * Client-only mount avoids MUI/JSS className hydration mismatches.
 */
export function SupplierFileBrowser(props: BrowserProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="sbj-chonky-shell sbj-chonky-skeleton"
        style={{ minHeight: props.height ?? 480 }}
        aria-busy="true"
      >
        <p className="muted" style={{ margin: 0, padding: '1.25rem', fontSize: '0.9rem' }}>
          Loading media browser…
        </p>
      </div>
    );
  }

  return <SupplierFileBrowserClient {...props} />;
}

function SupplierFileBrowserClient({
  mode,
  folders = [],
  assets,
  height = 480,
  onSelectionChange,
  pickOnActivate = false,
  onAssetPick,
  showCreateFolder = true,
  factoryMediaType = 'factory',
  factoryCaption = '',
}: BrowserProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const browserRef = useRef<FileBrowserHandle>(null);
  const [currentFolderId, setCurrentFolderId] = useState(ROOT_ID);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<BrowserAsset | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [folderIconSize, setFolderIconSize] = useState(() =>
    readStoredSize(FOLDER_SIZE_KEY, FOLDER_SIZE_DEFAULT),
  );
  const [fileIconSize, setFileIconSize] = useState(() =>
    readStoredSize(FILE_SIZE_KEY, FILE_SIZE_DEFAULT),
  );

  /** Root = folder layer; inside a folder = file layer */
  const isFolderLayer = currentFolderId === ROOT_ID;
  const activeIconSize = isFolderLayer ? folderIconSize : fileIconSize;

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);
  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const gridSizeAction = useMemo(() => makeGridSizeAction(activeIconSize), [activeIconSize]);

  const folderChain = useMemo((): FileArray => {
    const root: FileData = {
      id: ROOT_ID,
      name: mode === 'factory' ? 'Factory gallery' : 'Media library',
      isDir: true,
    };
    if (currentFolderId === ROOT_ID) return [root];

    if (mode === 'factory') {
      const name = currentFolderId === FACTORY_VIDEOS ? 'Videos' : 'Photos';
      return [root, { id: currentFolderId, name, isDir: true }];
    }

    const folder = folderMap.get(currentFolderId);
    return [root, folder ? folderFile(folder) : { id: currentFolderId, name: 'Folder', isDir: true }];
  }, [currentFolderId, mode, folderMap]);

  const files = useMemo((): FileArray => {
    if (mode === 'factory') {
      if (currentFolderId === ROOT_ID) {
        return [
          {
            id: FACTORY_PHOTOS,
            name: 'Photos',
            isDir: true,
            childrenCount: assets.filter((a) => a.contentKind === 'image').length,
            color: '#76EE59',
          },
          {
            id: FACTORY_VIDEOS,
            name: 'Videos',
            isDir: true,
            childrenCount: assets.filter((a) => a.contentKind === 'video').length,
            color: '#3b82f6',
          },
        ];
      }
      const kind = currentFolderId === FACTORY_VIDEOS ? 'video' : 'image';
      return assets.filter((a) => a.contentKind === kind).map(assetFile);
    }

    if (currentFolderId === ROOT_ID) {
      const dirs = folders.map(folderFile);
      const loose = assets.filter((a) => !a.folderId).map(assetFile);
      return [...dirs, ...loose];
    }
    return assets.filter((a) => a.folderId === currentFolderId).map(assetFile);
  }, [mode, currentFolderId, folders, assets]);

  const fileActions = useMemo(() => {
    const actions = [
      ChonkyActions.UploadFiles,
      ChonkyActions.DeleteFiles,
      ChonkyActions.ClearSelection,
      gridSizeAction,
    ];
    if (showCreateFolder && mode === 'library') {
      actions.unshift(ChonkyActions.CreateFolder);
    }
    return actions;
  }, [showCreateFolder, mode, gridSizeAction]);

  const thumbnailGenerator = useCallback(
    (file: FileData) => (file.thumbnailUrl ? Promise.resolve(file.thumbnailUrl) : null),
    [],
  );

  const clearSelection = useCallback(() => {
    browserRef.current?.setFileSelection(new Set());
    setSelectedCount(0);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const applyLayerIconSize = useCallback((size: number, layer: 'folder' | 'file') => {
    const next = clampIconSize(size);
    if (layer === 'folder') {
      setFolderIconSize(next);
      writeStoredSize(FOLDER_SIZE_KEY, next);
    } else {
      setFileIconSize(next);
      writeStoredSize(FILE_SIZE_KEY, next);
    }
    void browserRef.current?.requestFileAction(makeGridSizeAction(next), undefined as never);
  }, []);

  // Apply size for current layer on mount + whenever you navigate folders ↔ files
  useEffect(() => {
    const size = currentFolderId === ROOT_ID ? folderIconSize : fileIconSize;
    const t = window.setTimeout(() => {
      void browserRef.current?.requestFileAction(makeGridSizeAction(size), undefined as never);
      browserRef.current?.setFileSelection(new Set());
      setSelectedCount(0);
      onSelectionChange?.([]);
    }, 0);
    return () => window.clearTimeout(t);
    // intentionally: layer change + initial sizes only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const handleFileAction = useCallback<FileActionHandler>(
    async (data) => {
      if (data.id === ChonkyActions.MouseClickFile.id) {
        const { file, clickType, ctrlKey, shiftKey } = data.payload;
        // Chonky's double-click counter often resets after selection re-render (React 19).
        // Open folders on plain single-click; Ctrl/Shift keeps multi-select without navigating.
        if (file?.isDir && !ctrlKey && !shiftKey) {
          if (clickType === 'single' || clickType === 'double') {
            setCurrentFolderId(file.id);
            setPreview(null);
            clearSelection();
          }
        }
        return;
      }

      if (data.id === ChonkyActions.ChangeSelection.id) {
        const selected = data.state.selectedFiles ?? [];
        setSelectedCount(selected.length);
        const ids = selected
          .filter((f) => !f.isDir)
          .map((f) => f.id)
          .filter((id) => id !== ROOT_ID && !folderMap.has(id));
        onSelectionChange?.(ids);
        return;
      }

      if (data.id === ChonkyActions.ClearSelection.id) {
        setSelectedCount(0);
        onSelectionChange?.([]);
        return;
      }

      if (data.id === ChonkyActions.OpenFiles.id) {
        const { targetFile, files: openFiles } = data.payload;
        const fileToOpen = targetFile ?? openFiles?.[0];
        if (!fileToOpen) return;
        if (fileToOpen.isDir) {
          setCurrentFolderId(fileToOpen.id);
          setPreview(null);
          return;
        }
        const asset = assetMap.get(fileToOpen.id);
        if (pickOnActivate && mode === 'library' && asset) {
          onAssetPick?.(asset);
          return;
        }
        if (asset) setPreview(asset);
        return;
      }

      if (data.id === ChonkyActions.UploadFiles.id) {
        fileInputRef.current?.click();
        return;
      }

      if (data.id === ChonkyActions.CreateFolder.id) {
        const name = window.prompt('New folder name');
        if (!name?.trim()) return;
        setBusy(true);
        const result = await createMediaFolderAction(name.trim());
        setBusy(false);
        if (result.error) setBanner({ type: 'err', text: result.error });
        else {
          setBanner({ type: 'ok', text: `Folder “${name.trim()}” created.` });
          router.refresh();
        }
        return;
      }

      if (data.id === ChonkyActions.DeleteFiles.id) {
        const toDelete = data.state.selectedFilesForAction ?? [];
        if (!toDelete.length) return;
        if (!window.confirm(`Delete ${toDelete.length} item(s)?`)) return;
        if (mode !== 'library') {
          setBanner({ type: 'err', text: 'Delete factory items from Ops review for now.' });
          return;
        }
        setBusy(true);
        for (const f of toDelete) {
          if (f.isDir) continue;
          await deleteMediaAssetAction(f.id);
        }
        setBusy(false);
        setBanner({ type: 'ok', text: 'Deleted.' });
        setPreview(null);
        router.refresh();
      }
    },
    [assetMap, clearSelection, folderMap, mode, onAssetPick, onSelectionChange, pickOnActivate, router],
  );

  async function onFilesPicked(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setBanner(null);
    let ok = 0;
    const names: string[] = [];
    let navigateToFolderId: string | null = null;

    for (const file of Array.from(list)) {
      if (isHeicUploadFile(file)) {
        setBanner({
          type: 'err',
          text: `"${file.name}" is HEIC — export as JPG or PNG first (Photos → Share → Save as JPEG).`,
        });
        continue;
      }

      const isImage = isImageUploadFile(file);
      const isVideo = isVideoUploadFile(file);
      if (!isImage && !isVideo) {
        setBanner({
          type: 'err',
          text: `"${file.name}" — use JPG, PNG, WebP, GIF, or MP4/WebM video.`,
        });
        continue;
      }

      if (isImage && file.size > MAX_IMAGE_UPLOAD_BYTES) {
        setBanner({ type: 'err', text: `"${file.name}" is too large — images max 5MB.` });
        continue;
      }

      if (mode === 'library') {
        const fd = new FormData();
        fd.append('file', file);
        if (currentFolderId !== ROOT_ID && folderMap.has(currentFolderId)) {
          fd.append('folderId', currentFolderId);
        }
        const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
        let result: { error?: string; folderId?: string | null } = {};
        try {
          result = (await res.json()) as typeof result;
        } catch {
          setBanner({ type: 'err', text: res.ok ? 'Upload failed.' : `Upload failed (${res.status}).` });
          continue;
        }
        if (!res.ok || result.error) {
          setBanner({ type: 'err', text: result.error ?? `Upload failed (${res.status}).` });
        } else {
          ok += 1;
          names.push(file.name);
          if (result.folderId) navigateToFolderId = result.folderId;
        }
      } else {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('mediaType', factoryMediaType);
        fd.append('caption', factoryCaption || file.name);
        const res = await fetch('/api/gallery/upload', { method: 'POST', body: fd });
        let result: { error?: string; contentKind?: string } = {};
        try {
          result = (await res.json()) as typeof result;
        } catch {
          setBanner({ type: 'err', text: res.ok ? 'Upload failed.' : `Upload failed (${res.status}).` });
          continue;
        }
        if (!res.ok || result.error) {
          setBanner({ type: 'err', text: result.error ?? `Upload failed (${res.status}).` });
        } else {
          ok += 1;
          names.push(file.name);
          navigateToFolderId = result.contentKind === 'video' ? FACTORY_VIDEOS : FACTORY_PHOTOS;
        }
      }
    }

    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (ok > 0) {
      if (navigateToFolderId) {
        setCurrentFolderId(navigateToFolderId);
        setPreview(null);
        clearSelection();
      }
      setBanner({
        type: 'ok',
        text: ok === 1 ? `Uploaded “${names[0]}”.` : `Uploaded ${ok} files.`,
      });
      router.refresh();
    }
  }

  const listHeight = Math.max(height - 160, 280);

  const shellStyle: CSSProperties = {
    borderRadius: 18,
    border: '1px solid color-mix(in srgb, #76EE59 35%, #e5e7eb)',
    boxShadow: '0 12px 40px rgba(16, 40, 12, 0.06)',
    background: 'linear-gradient(180deg, #f7fbf4 0%, #ffffff 48px)',
    minHeight: height,
    display: 'flex',
    flexDirection: 'column',
    ['--sbj-list-h' as string]: `${listHeight}px`,
  };

  return (
    <ThemeProvider theme={cuteTheme}>
      <div>
        {banner ? (
          <p
            className={banner.type === 'ok' ? 'sbj-toast-ok' : 'sbj-toast-err'}
            style={{ marginBottom: '0.75rem' }}
          >
            {banner.text}
          </p>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => void onFilesPicked(e.target.files)}
        />

        <div
          style={shellStyle}
          className="sbj-chonky-shell"
          data-height={height}
          data-testid="sbj-file-browser"
          data-layer={isFolderLayer ? 'folders' : 'files'}
          data-folder={currentFolderId}
        >
          <FileBrowser
            ref={browserRef}
            files={files}
            folderChain={folderChain}
            fileActions={fileActions}
            onFileAction={handleFileAction}
            thumbnailGenerator={thumbnailGenerator}
            defaultFileViewActionId={GRID_ACTION_ID}
            disableDefaultFileActions={[ChonkyActions.EnableGridView.id]}
          >
            <FileNavbar />
            <FileToolbar />
            <div className="sbj-chonky-list">
              <ChonkyFileList />
            </div>
            <FileContextMenu />
          </FileBrowser>

          <div className="sbj-icon-size-bar" role="group" aria-label="View options">
            <button
              type="button"
              className="sbj-clear-selection-btn"
              disabled={selectedCount === 0}
              onClick={clearSelection}
              title="Clear selection (Esc)"
            >
              Clear selection{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </button>

            <span className="sbj-icon-size-layer">
              {isFolderLayer ? 'Folders' : 'Files'}
            </span>
            <span className="sbj-icon-size-label" aria-hidden>
              ▦
            </span>
            <input
              type="range"
              min={ICON_SIZE_MIN}
              max={ICON_SIZE_MAX}
              step={4}
              value={activeIconSize}
              onChange={(e) =>
                applyLayerIconSize(Number(e.target.value), isFolderLayer ? 'folder' : 'file')
              }
              aria-label={isFolderLayer ? 'Folder icon size' : 'File icon size'}
              title={`${isFolderLayer ? 'Folder' : 'File'} icon size: ${activeIconSize}px`}
            />
            <span className="sbj-icon-size-label sbj-icon-size-label-lg" aria-hidden>
              ▦
            </span>
            <span className="muted" style={{ fontSize: '0.75rem', minWidth: '2.5rem' }}>
              {activeIconSize}px
            </span>
          </div>
        </div>

        {busy ? (
          <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Working…
          </p>
        ) : (
          <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            Click a folder to open · Clear selection / Esc · Slider sizes {isFolderLayer ? 'folders' : 'files'}
          </p>
        )}

        {preview ? (
          <div className="card sbj-media-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem' }}>{preview.caption ?? 'Preview'}</strong>
              <button type="button" className="sbj-text-btn" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            {preview.contentKind === 'video' ? (
              <video
                src={preview.publicUrl}
                controls
                playsInline
                style={{ width: '100%', maxHeight: 320, marginTop: 8, borderRadius: 12, background: '#000' }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.publicUrl}
                alt=""
                style={{ width: '100%', maxHeight: 320, objectFit: 'contain', marginTop: 8, borderRadius: 12 }}
              />
            )}
          </div>
        ) : null}
      </div>
    </ThemeProvider>
  );
}
