export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function isAllowedPhoto(mimeType: string): boolean {
  return (ALLOWED_PHOTO_TYPES as readonly string[]).includes(mimeType);
}
