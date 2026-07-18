import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

const cloudinaryEnvironment = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
  CLOUDINARY_API_KEY: z.string().trim().min(1),
  CLOUDINARY_API_SECRET: z.string().trim().min(1),
});

let configured = false;

export function getCloudinary() {
  const parsed = cloudinaryEnvironment.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Cloudinary image management is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: parsed.data.CLOUDINARY_CLOUD_NAME,
      api_key: parsed.data.CLOUDINARY_API_KEY,
      api_secret: parsed.data.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return {
    client: cloudinary,
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
  };
}

export const CLOUDINARY_PRODUCT_FOLDER = "pick-plant/products";
export const CLOUDINARY_TEMP_FOLDER = "pick-plant/temp";

export function isSafeCloudinaryPublicId(publicId: string) {
  return /^pick-plant\/(?:products|temp)\/[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(publicId) &&
    !publicId.includes("..") &&
    !publicId.endsWith("/");
}

export async function destroyCloudinaryImage(publicId: string) {
  if (!isSafeCloudinaryPublicId(publicId)) {
    throw new Error("The Cloudinary public ID is invalid.");
  }
  const { client } = getCloudinary();
  return client.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
}

export async function moveCloudinaryImage(publicId: string, destinationPublicId: string) {
  if (!isSafeCloudinaryPublicId(publicId) || !isSafeCloudinaryPublicId(destinationPublicId)) {
    throw new Error("Invalid Cloudinary image identifier.");
  }
  const { client } = getCloudinary();
  return client.uploader.rename(publicId, destinationPublicId, {
    resource_type: "image",
    overwrite: false,
    invalidate: true,
  });
}
