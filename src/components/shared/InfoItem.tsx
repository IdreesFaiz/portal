interface InfoItemProps {
  /** Label displayed above the value. */
  label: string;
  /** Primary value text. */
  value: string;
}

/**
 * Small info card — displays a label / value pair in a subtle rounded box.
 * Used in student detail grids and result card modals.
 */
export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value}</p>
    </div>
  );
}
