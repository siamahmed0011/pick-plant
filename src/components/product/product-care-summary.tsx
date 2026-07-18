import { Droplets, FlaskConical, Sun, Thermometer, Waves } from "lucide-react";
export function ProductCareSummary({
  product,
}: {
  product: {
    lightRequirement: string;
    wateringFrequency: string;
    temperature?: string;
    humidity?: string;
  };
}) {
  const items = [
    { label: "আলো", value: product.lightRequirement, Icon: Sun },
    { label: "পানি", value: product.wateringFrequency, Icon: Droplets },
    { label: "মাটি", value: "ঝরঝরে পটিং মাটি", Icon: Waves },
    { label: "সার", value: "মাসে একবার", Icon: FlaskConical },
    { label: "তাপমাত্রা", value: product.temperature ?? "১৮–৩০°C", Icon: Thermometer },
    { label: "আর্দ্রতা", value: product.humidity ?? "মাঝারি আর্দ্রতা", Icon: Waves },
  ];
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold">Plant Care Summary</h2>
      <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ label, value, Icon }) => (
          <div className="bg-white p-5" key={label}>
            <Icon className="text-[var(--primary)]" size={21} />
            <p className="mt-3 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
