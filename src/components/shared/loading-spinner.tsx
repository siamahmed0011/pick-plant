export function LoadingSpinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
    />
  );
}
