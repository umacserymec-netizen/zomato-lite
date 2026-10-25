"use client";

// A real radio group wearing star costumes.
// The invisible <input> sits on top of the star at full size, so the tap
// target is the whole 48×48 button. Because the inputs are real radios,
// keyboard users can Tab in and move with the arrow keys.

import { StarIcon } from "./Stars";

type StarPickerProps = {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
};

export default function StarPicker({
  value,
  onChange,
  disabled = false,
}: StarPickerProps) {
  return (
    <fieldset disabled={disabled} className={disabled ? "opacity-60" : ""}>
      <legend className="mb-2.5 block text-sm font-medium text-[#44403c]">
        Your rating
      </legend>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = star <= value;
          return (
            <div key={star} className="relative h-12 w-12">
              <input
                type="radio"
                id={`rating-${star}`}
                name="rating"
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                aria-label={`${star} out of 5 stars`}
                className="peer absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none rounded-xl opacity-0"
              />
              <div
                aria-hidden="true"
                className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#e23744] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#fffaf7] ${
                  selected
                    ? "border-[#e23744] bg-[#fff1f2] text-[#e23744]"
                    : "border-[#e2ddd5] bg-white text-[#c4bdb3] hover:border-[#c4bdb3]"
                }`}
              >
                <StarIcon filled={selected} className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[#a8a29e]">
        {value > 0 ? `${value} out of 5 selected` : "Tap a star to choose"}
      </p>
    </fieldset>
  );
}
