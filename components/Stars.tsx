// Presentation only. These stars draw a number they were handed —
// they never add, divide or sort anything.

type StarIconProps = {
  filled: boolean;
  className?: string;
};

export function StarIcon({ filled, className = "h-4 w-4" }: StarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      strokeLinejoin="round"
    >
      <path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.7l6.1-.9L12 3.2z" />
    </svg>
  );
}

type StarsProps = {
  value: number;
  className?: string;
  size?: "sm" | "md";
};

export default function Stars({ value, size = "sm" }: StarsProps) {
  return (
    <span
      role="img"
      aria-label={`${value} out of 5 stars`}
      className={`inline-flex items-center gap-0.5 text-[#b45309] ${
        size === "sm" ? "" : "gap-1"
      }`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          filled={star <= value}
          className={size === "sm" ? "h-4 w-4" : "h-5 w-5"}
        />
      ))}
    </span>
  );
}
