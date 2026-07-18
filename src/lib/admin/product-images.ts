import "server-only";

import { isSafeCloudinaryPublicId } from "@/lib/cloudinary";
import type { ProductImageDraft } from "@/types/admin-product";

export type ExistingProductImage = {
  id: string;
  url: string;
  publicId: string | null;
  secureUrl: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  altText: string | null;
};

export type NormalizedProductImage = {
  url: string;
  publicId: string | null;
  secureUrl: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  altText: string | null;
  position: number;
  isPrimary: boolean;
};

function isCloudinarySecureUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function normalizeProductImages({
  drafts,
  existing,
  productId,
  creating,
}: {
  drafts: ProductImageDraft[];
  existing: ExistingProductImage[];
  productId?: string;
  creating: boolean;
}) {
  const existingById = new Map(existing.map((image) => [image.id, image]));
  const seenIds = new Set<string>();
  const seenPublicIds = new Set<string>();
  const normalized: NormalizedProductImage[] = [];

  for (const [position, draft] of drafts.entries()) {
    if (draft.id) {
      const current = existingById.get(draft.id);
      if (!current || seenIds.has(draft.id)) {
        return { error: "One of the selected images does not belong to this product." } as const;
      }
      seenIds.add(draft.id);
      if (current.publicId) seenPublicIds.add(current.publicId);
      const secureUrl = current.secureUrl ?? current.url;
      normalized.push({
        url: current.url,
        publicId: current.publicId,
        secureUrl,
        width: current.width,
        height: current.height,
        format: current.format,
        bytes: current.bytes,
        altText: draft.altText || current.altText,
        position,
        isPrimary: position === 0,
      });
      continue;
    }

    if (!draft.publicId || !isSafeCloudinaryPublicId(draft.publicId)) {
      return { error: "Each new image must come from a trusted Cloudinary upload." } as const;
    }
    if (creating ? !draft.publicId.startsWith("pick-plant/temp/") : !draft.publicId.startsWith(`pick-plant/products/${productId}/`)) {
      return { error: "This uploaded image is not valid for the selected product." } as const;
    }
    if (!isCloudinarySecureUrl(draft.secureUrl) || seenPublicIds.has(draft.publicId)) {
      return { error: "One of the uploaded images is invalid or duplicated." } as const;
    }
    seenPublicIds.add(draft.publicId);
    normalized.push({
      url: draft.secureUrl,
      publicId: draft.publicId,
      secureUrl: draft.secureUrl,
      width: draft.width,
      height: draft.height,
      format: draft.format,
      bytes: draft.bytes,
      altText: draft.altText || null,
      position,
      isPrimary: position === 0,
    });
  }

  const retainedPublicIds = new Set(normalized.map((image) => image.publicId).filter(Boolean));
  const removedPublicIds = existing
    .map((image) => image.publicId)
    .filter((publicId): publicId is string => Boolean(publicId && !retainedPublicIds.has(publicId)));

  return { images: normalized, removedPublicIds } as const;
}
