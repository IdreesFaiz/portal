interface SummaryCardProps {
  /** Descriptor text below the value. */
  label: string;
  /** Primary value text. */
  value: string;
  /** Colour key — maps to predefined Tailwind utility classes. */
  color: string;
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-900",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
  green: "bg-green-50 border-green-200 text-green-900",
  red: "bg-red-50 border-red-200 text-red-900",
};

/**
 * Summary card — shows a bold value and label in a colour-coded box.
 * Used in result card modals and the public results page.
 */
export default function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <div className={`border rounded-lg p-3 text-center ${COLOR_MAP[color] ?? COLOR_MAP.blue}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5 opacity-70">{label}</p>
    </div>
  );
}
