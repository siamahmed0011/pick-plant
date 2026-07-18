"use client";
import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const move = (step: number) =>
    setActive((index) => (index + step + images.length) % images.length);
  return (
    <div className="grid gap-4 sm:grid-cols-[5rem_1fr]">
      <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:grid sm:grid-cols-1">
        {images.map((src, index) => (
          <button
            type="button"
            aria-label={`View ${name} image ${index + 1}`}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
            className={`relative aspect-square min-w-20 overflow-hidden rounded-xl border bg-[var(--background)] ${active === index ? "ring-2 ring-[var(--primary)]" : ""}`}
            key={`${src}-${index}`}
          >
            <Image src={src} alt={`${name} thumbnail ${index + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>
      <div className="relative order-1 aspect-square overflow-hidden rounded-2xl bg-[var(--background)] sm:order-2">
        <button
          type="button"
          aria-label="Toggle image zoom"
          onClick={() => setZoom((value) => !value)}
          className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white"
        >
          <ZoomIn size={18} />
        </button>
        <Image
          src={images[active]}
          alt={`${name} image ${active + 1}`}
          fill
          priority
          className={`object-cover transition duration-500 ${zoom ? "scale-125" : ""}`}
        />
        <button
          type="button"
          aria-label="Previous image"
          onClick={() => move(-1)}
          className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          aria-label="Next image"
          onClick={() => move(1)}
          className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
