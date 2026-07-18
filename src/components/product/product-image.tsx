import Image from "next/image";
export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--muted-surface)]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition duration-200 group-hover:scale-[1.03]"
      />
    </div>
  );
}
