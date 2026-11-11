import { v2 as cloudinary } from "cloudinary";

// `exactOptionalPropertyTypes` forbids passing `undefined` for an optional key,
// so missing credentials are omitted rather than set to undefined. Cloudinary
// then fails the upload instead of silently configuring an empty account.
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  ...(cloudName ? { cloud_name: cloudName } : {}),
  ...(apiKey ? { api_key: apiKey } : {}),
  ...(apiSecret ? { api_secret: apiSecret } : {}),
});

export function uploadProfilePhoto(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "vybe/profiles",
        resource_type: "image",
        transformation: [{ width: 800, height: 800, crop: "fill", gravity: "face" }],
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}
