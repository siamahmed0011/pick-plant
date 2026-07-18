export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-[var(--muted)]">{description}</p>}
    </div>
  );
}
