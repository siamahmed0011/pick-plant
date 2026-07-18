"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, ImagePlus, LoaderCircle, RotateCcw, Star, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImageCropDialog } from "@/components/admin/products/product-image-crop-dialog";
import type { ProductImageDraft } from "@/types/admin-product";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 8;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadItem = ProductImageDraft & { status?: "uploaded" | "uploading" | "error"; error?: string; progress?: number };
type CropQueueItem = { file: File; replaceIndex?: number };

function formatBytes(bytes: number | null) {
  if (bytes === null) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function compressImage(blob: Blob) {
  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Image compression is not supported in this browser."));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((compressed) => compressed ? resolve(compressed) : reject(new Error("Image compression failed.")), "image/webp", 0.84);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The selected image could not be read.")); };
    image.src = url;
  });
}

export function ProductImageUploader({
  initialImages,
  productId,
  onChange,
}: {
  initialImages: ProductImageDraft[];
  productId?: string;
  onChange: (images: ProductImageDraft[]) => void;
}) {
  const [images, setImages] = useState<UploadItem[]>(initialImages.map((image) => ({ ...image, status: "uploaded" })));
  const [queue, setQueue] = useState<CropQueueItem[]>([]);
  const [activeCrop, setActiveCrop] = useState<CropQueueItem | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | undefined>();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryItem, setRetryItem] = useState<CropQueueItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onChange(images.map((image) => {
      const { status, error, progress, ...draft } = image;
      void status; void error; void progress;
      return draft;
    }));
  }, [images, onChange]);

  function normalize(next: UploadItem[]) {
    return next.map((image, index) => ({ ...image, position: index, isPrimary: index === 0 }));
  }

  function validateFiles(files: File[]) {
    const accepted: File[] = [];
    const existingKeys = new Set(images.map((image) => `${image.originalName ?? ""}:${image.bytes ?? ""}`));
    for (const file of files) {
      if (!allowedTypes.has(file.type)) { setUploadError(`${file.name}: use JPG, PNG, or WEBP images only.`); continue; }
      if (file.size > MAX_FILE_SIZE) { setUploadError(`${file.name}: each image must be 5 MB or smaller.`); continue; }
      const key = `${file.name}:${file.size}`;
      if (existingKeys.has(key) || accepted.some((item) => `${item.name}:${item.size}` === key)) { setUploadError(`${file.name}: this image is already selected.`); continue; }
      accepted.push(file);
    }
    const capacity = MAX_IMAGES - images.length;
    if (accepted.length > capacity && replaceIndex === undefined) {
      setUploadError(`You can upload up to ${MAX_IMAGES} images per product.`);
      return accepted.slice(0, capacity);
    }
    return accepted;
  }

  function selectFiles(fileList: FileList | File[], nextReplaceIndex?: number) {
    setUploadError(null);
    const files = validateFiles(Array.from(fileList));
    if (!files.length) return;
    setReplaceIndex(nextReplaceIndex);
    setActiveCrop({ file: files[0], replaceIndex: nextReplaceIndex });
    setQueue(files.slice(1).map((file) => ({ file, replaceIndex: nextReplaceIndex })));
  }

  async function uploadBlob(blob: Blob, originalFile: File, targetIndex?: number) {
    setUploadError(null);
    const temporaryId = `pending-${Date.now()}-${Math.random()}`;
    setImages((current) => normalize(targetIndex === undefined
      ? [...current, { publicId: null, secureUrl: "", width: null, height: null, format: null, bytes: null, altText: "", originalName: originalFile.name, isPrimary: current.length === 0, position: current.length, status: "uploading" }]
      : current.map((image, index) => index === targetIndex ? { ...image, originalName: originalFile.name, status: "uploading" } : image)));
    try {
      const signatureResponse = await fetch("/api/admin/products/images/signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(productId ? { productId } : {}) });
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signature.message ?? "Could not start image upload.");
      const formData = new FormData();
      formData.append("file", blob, `${originalFile.name.replace(/\.[^.]+$/, "")}.webp`);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", String(signature.timestamp));
      formData.append("signature", signature.signature);
      formData.append("folder", signature.folder);
      const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          setImages((current) => current.map((image) => image.originalName === originalFile.name && image.secureUrl === "" ? { ...image, progress } : image));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error("Cloudinary upload failed."));
        xhr.onerror = () => reject(new Error("Cloudinary upload failed."));
        xhr.send(formData);
      });
      const uploaded: UploadItem = {
        publicId: String(result.public_id), secureUrl: String(result.secure_url), width: Number(result.width) || null, height: Number(result.height) || null, format: String(result.format ?? "webp"), bytes: Number(result.bytes) || blob.size, altText: "", originalName: originalFile.name, isPrimary: false, position: 0, status: "uploaded",
      };
      setImages((current) => normalize(targetIndex === undefined ? current.map((image) => image.originalName === originalFile.name && image.secureUrl === "" ? uploaded : image) : current.map((image, index) => index === targetIndex ? { ...uploaded, id: image.id, altText: image.altText, isPrimary: image.isPrimary } : image)));
    } catch (error) {
      setImages((current) => current.map((image) => image.originalName === originalFile.name && image.secureUrl === "" ? { ...image, status: "error", progress: 0 } : image));
      setRetryItem({ file: originalFile, replaceIndex: targetIndex });
      setUploadError(error instanceof Error ? error.message : "Image upload failed. Try again.");
    }
    void temporaryId;
  }

  async function handleCrop(blob: Blob) {
    if (!activeCrop) return;
    const compressed = await compressImage(blob);
    await uploadBlob(compressed, activeCrop.file, activeCrop.replaceIndex);
    setActiveCrop(null);
    const next = queue[0];
    setQueue((current) => current.slice(1));
    if (next) setActiveCrop(next);
  }

  function remove(index: number) {
    if (!window.confirm("Remove this image from the product? The removal is applied when you save the product.")) return;
    setImages((current) => normalize(current.filter((_, itemIndex) => itemIndex !== index)));
  }

  function markPrimary(index: number) {
    setImages((current) => normalize([current[index], ...current.filter((_, itemIndex) => itemIndex !== index)]));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return normalize(next); });
  }

  return (
    <div className="grid gap-4">
      <input ref={replaceInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { if (event.target.files) selectFiles(event.target.files, replaceIndex); event.currentTarget.value = ""; }} />
      <div
        className={`grid min-h-36 place-items-center rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-[var(--primary)] bg-[var(--muted-surface)]" : "border-[var(--border)]"}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); selectFiles(event.dataTransfer.files); }}
      >
        <div>
          <UploadCloud className="mx-auto text-[var(--primary)]" size={30} aria-hidden="true" />
          <p className="mt-2 font-semibold">Drop images here</p>
          <p className="mt-1 text-sm text-[var(--muted)]">JPG, PNG or WEBP, up to 5 MB each, maximum 8 images.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => { setReplaceIndex(undefined); replaceInputRef.current?.click(); }}>
            <ImagePlus size={17} aria-hidden="true" /> Choose images
          </Button>
        </div>
      </div>
      {uploadError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]" role="alert">{uploadError}</p>}
      {retryItem && <Button type="button" variant="outline" onClick={() => { setActiveCrop(retryItem); setRetryItem(null); }}>Retry failed upload</Button>}
      {images.length > 0 && (
        <div className="grid gap-3">
          {images.map((image, index) => (
            <div
              className="grid gap-3 rounded-2xl border p-3 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center"
              key={`${image.id ?? image.publicId ?? image.originalName}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const source = dragIndex;
                if (source === null || source === index) return;
                setImages((current) => { const next = [...current]; const [moved] = next.splice(source, 1); next.splice(index, 0, moved); return normalize(next); });
                setDragIndex(null);
              }}
              data-index={index}
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--muted-surface)]">
                {image.secureUrl ? <img src={image.secureUrl} alt={image.altText || image.originalName || "Product image"} className="absolute inset-0 size-full object-cover" /> : <LoaderCircle className="absolute inset-0 m-auto animate-spin text-[var(--primary)]" size={22} aria-label="Uploading" />}
                {image.status === "uploading" && <span className="absolute inset-x-0 bottom-0 h-1 bg-white/40"><span className="block h-full bg-[var(--primary)]" style={{ width: `${image.progress ?? 0}%` }} /></span>}
                {index === 0 && <span className="absolute left-1 top-1 rounded-full bg-[var(--primary)] px-2 py-1 text-[10px] font-bold text-white">Primary</span>}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{image.originalName || "Uploaded image"}</p>
                <p className="text-xs text-[var(--muted)]">{image.width && image.height ? `${image.width} × ${image.height}` : "Dimensions pending"} · {formatBytes(image.bytes)}</p>
                <label className="mt-2 block text-sm font-medium">Alt text<input className="mt-1 h-9 w-full rounded-lg border px-2" value={image.altText} maxLength={160} onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, altText: event.target.value } : item))} /></label>
              </div>
              <div className="flex flex-wrap justify-end gap-1 sm:max-w-44">
                <Button type="button" size="sm" variant="ghost" disabled={index === 0 || image.status === "uploading"} onClick={() => markPrimary(index)} aria-label={`Make ${image.originalName || "image"} primary`}><Star size={15} /> Primary</Button>
                <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move image up"><GripVertical size={15} /> Up</Button>
                <Button type="button" size="sm" variant="ghost" disabled={index === images.length - 1} onClick={() => move(index, 1)} aria-label="Move image down"><GripVertical size={15} /> Down</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setReplaceIndex(index); replaceInputRef.current?.click(); }} aria-label="Replace image"><RotateCcw size={15} /> Replace</Button>
                <Button type="button" size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => remove(index)} aria-label="Remove image"><Trash2 size={15} /> Remove</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ProductImageCropDialog file={activeCrop?.file ?? null} onCancel={() => { setActiveCrop(null); setQueue([]); }} onConfirm={(blob) => void handleCrop(blob)} />
    </div>
  );
}
