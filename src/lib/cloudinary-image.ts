import "server-only";

import { getCloudinary } from "@/lib/cloudinary";

type ImageTransformation = {
  width: number;
  height?: number;
  crop?: "fill" | "limit";
};

export function cloudinaryImageUrl(
  publicId: string | null | undefined,
  fallbackUrl: string,
  transformation: ImageTransformation,
) {
  if (!publicId) return fallbackUrl;
  try {
    const { client } = getCloudinary();
    return client.url(publicId, {
      secure: true,
      resource_type: "image",
      transformation: [
        {
          fetch_format: "auto",
          quality: "auto",
          width: transformation.width,
          ...(transformation.height ? { height: transformation.height } : {}),
          crop: transformation.crop ?? "limit",
        },
      ],
    });
  } catch {
    return fallbackUrl;
  }
}

export function productCardImageUrl(publicId: string | null | undefined, fallbackUrl: string) {
  return cloudinaryImageUrl(publicId, fallbackUrl, { width: 640, height: 640, crop: "fill" });
}

export function productDetailImageUrl(publicId: string | null | undefined, fallbackUrl: string) {
  return cloudinaryImageUrl(publicId, fallbackUrl, { width: 1400, crop: "limit" });
}
