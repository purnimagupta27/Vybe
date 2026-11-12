import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { uploadProfilePhoto } from "../../lib/api";
import type { OnboardingDraft } from "./draft";

type StepPhotoProps = {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  errors: Record<string, string>;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const labelClass =
  "font-heading mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50";

const pickerClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-sm font-medium text-white/90 transition-[background-color,border-color,opacity] duration-200 hover:border-white/40 hover:bg-white/10";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-300">{message}</p>;
}

export default function StepPhoto({ draft, update, errors }: StepPhotoProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  // Tracks the object URL currently shown so it can be revoked exactly once.
  const objectUrlRef = useRef<string | null>(null);
  // Ignore responses from an upload the user has already replaced or left.
  const requestRef = useRef(0);

  function releaseObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      requestRef.current += 1;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Photo must be JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setUploadError("Photo must be under 5 MB.");
      return;
    }

    releaseObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    setUploadError(null);
    setUploading(true);

    const requestId = ++requestRef.current;
    try {
      const url = await uploadProfilePhoto(file);
      if (requestRef.current !== requestId) return;
      // The Cloudinary URL replaces the local preview, so the blob is done.
      releaseObjectUrl();
      setLocalPreview(null);
      update({ photoUrl: url });
    } catch (err) {
      if (requestRef.current !== requestId) return;
      // A failed upload must not look like a chosen photo: drop the preview and
      // fall back to the last confirmed URL (if the profile already had one).
      releaseObjectUrl();
      setLocalPreview(null);
      setUploadError(
        err instanceof Error ? err.message : "Could not upload the photo. Please try again.",
      );
    } finally {
      if (requestRef.current === requestId) setUploading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires a change (retry).
    event.target.value = "";
    if (file) void handleFile(file);
  }

  const previewUrl = localPreview ?? draft.photoUrl;

  return (
    <div className="space-y-6">
      <div>
        <span className={labelClass}>Profile photo</span>
        <div className="flex items-center gap-6 rounded-2xl border border-white/15 bg-white/5 px-6 py-6">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile photo preview"
                className="size-full object-cover"
              />
            ) : (
              <Camera aria-hidden="true" className="size-7 text-white/35" />
            )}
          </div>

          <div className="min-w-0">
            <label className={`${pickerClass} ${uploading ? "pointer-events-none opacity-40" : ""}`}>
              <Camera aria-hidden="true" className="size-4" />
              {uploading ? "Uploading…" : draft.photoUrl ? "Change photo" : "Choose photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              JPEG, PNG, or WebP up to 5 MB. This is the only photo shown on your
              profile.
            </p>
          </div>
        </div>
        <FieldError message={uploadError ?? (draft.photoUrl ? undefined : errors.photo)} />
      </div>
    </div>
  );
}
