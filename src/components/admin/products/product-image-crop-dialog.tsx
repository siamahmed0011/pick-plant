"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ProductImageCropDialog({
  file,
  onCancel,
  onConfirm,
}: {
  file: File | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const size = 360;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, size, size);
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (size - width) / 2 + (offsetX / 100) * size;
    const y = (size - height) / 2 + (offsetY / 100) * size;
    context.drawImage(image, x, y, width, height);
  }, [offsetX, offsetY, zoom]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { imageRef.current = image; draw(); };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [draw, file]);

  useEffect(() => { draw(); }, [draw]);

  function confirmCrop() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/webp", 0.86);
  }

  return (
    <Modal open={Boolean(file)} title="Crop product image" onClose={onCancel}>
      <div className="grid gap-5">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Adjust the square crop before compression and upload. Use the sliders to pan and zoom.
        </p>
        <div className="mx-auto overflow-hidden rounded-2xl bg-black">
          <canvas ref={canvasRef} className="size-full max-w-full" aria-label="Image crop preview" />
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Zoom
          <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} aria-label="Crop zoom" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Pan horizontal
            <input type="range" min="-100" max="100" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} aria-label="Crop horizontal position" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Pan vertical
            <input type="range" min="-100" max="100" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} aria-label="Crop vertical position" />
          </label>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }}>
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="button" onClick={confirmCrop}>Use crop</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
