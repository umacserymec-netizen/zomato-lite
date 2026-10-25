// The green rating pill used on cards and banners. It prints the number it
// is given, formatted to one decimal place. It never calculates an average.

type RatingBadgeProps = {
  value: number | null;
  size?: "sm" | "lg";
};

export default function RatingBadge({ value, size = "sm" }: RatingBadgeProps) {
  if (value === null) {
    return (
      <span className="inline-flex items-center rounded-md bg-[#f2ece7] px-1.5 py-0.5 text-xs font-semibold text-[#78716c]">
        New
      </span>
    );
  }

  return (
    <span
      aria-label={`${value} out of 5 stars`}
      className={`inline-flex items-center gap-1 rounded-md bg-[#1f7a3d] font-semibold text-white ${
        size === "lg" ? "px-2 py-1 text-sm" : "px-1.5 py-0.5 text-xs"
      }`}
    >
      <span aria-hidden="true" className="text-[0.9em] leading-none">
        ★
      </span>
      {value.toFixed(1)}
    </span>
  );
}
