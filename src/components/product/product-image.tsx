export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--muted-surface)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- Product images use admin-managed external URLs. */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition duration-200 group-hover:scale-[1.03]"
      />
    </div>
  );
}
