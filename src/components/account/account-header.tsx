export function AccountPageHeader({
  eyebrow = "MY ACCOUNT",
  title,
  subtitle,
  bengaliSubtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bengaliSubtitle?: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1E5A3A]">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-[26px] sm:text-[30px] lg:text-[40px] font-bold tracking-tight text-[#1F2D22]">
        {title}
      </h1>
      {bengaliSubtitle && (
        <p className="mt-1.5 text-sm sm:text-base font-medium text-[#66746A] font-bengali-system">
          {bengaliSubtitle}
        </p>
      )}
      {subtitle && !bengaliSubtitle && (
        <p className="mt-1.5 text-sm sm:text-base text-[#66746A] leading-relaxed">
          {subtitle}
        </p>
      )}
    </header>
  );
}

export { AccountPageHeader as AccountHeader };
