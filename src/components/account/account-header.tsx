export function AccountHeader({ name }: { name?: string | null }) {
  return (
    <header>
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">
        My Account
      </p>
      <h1 className="text-3xl font-bold">Welcome{name ? `, ${name}` : " to Pick Plant"}</h1>
      <p className="mt-2 text-[var(--muted)]">
        আপনার অ্যাকাউন্ট, নিরাপত্তা এবং ভবিষ্যৎ অর্ডার সংক্রান্ত তথ্য এখানে পাওয়া যাবে।
      </p>
    </header>
  );
}
