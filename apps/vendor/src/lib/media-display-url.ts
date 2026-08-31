/** Same-origin URL for seller UI thumbnails (avoids brittle localhost:54321 img loads). */
export function vendorMediaServeUrl(assetId: string): string {
  return `/api/media/serve/${assetId}`;
}

/** Minimum bytes for a real image — filters broken test uploads (1×1 PNG stubs). */
export const MIN_MEDIA_ASSET_BYTES = 512;
