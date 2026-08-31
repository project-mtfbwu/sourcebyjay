/** Only URLs from our Supabase supplier-media bucket (self-upload). No YouTube/external paste. */
export function isSelfHostedMediaUrl(url: string): boolean {
  if (!url.startsWith('http')) return false;
  try {
    const parsed = new URL(url);
    return parsed.pathname.includes('/storage/v1/object/public/supplier-media/');
  } catch {
    return false;
  }
}

export const MAX_PRODUCT_MEDIA = 7;

/** Max image upload size (seller media library, storefront, listings). */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
const HEIC_EXT = /\.(heic|heif)$/i;

export function isHeicUploadFile(file: Pick<File, 'name' | 'type'>): boolean {
  return file.type === 'image/heic' || file.type === 'image/heif' || HEIC_EXT.test(file.name);
}

export function isImageUploadFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (isHeicUploadFile(file)) return false;
  if (file.type.startsWith('image/')) return true;
  return IMAGE_EXT.test(file.name);
}

export function isVideoUploadFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (file.type.startsWith('video/')) return true;
  return VIDEO_EXT.test(file.name);
}
