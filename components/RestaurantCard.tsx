// One restaurant card on the home page. The gradient and emoji stand in for a
// photo: no external images, no downloads, still different on every card.

import Link from "next/link";
import RatingBadge from "./RatingBadge";

export type RestaurantSummary = {
  id: number;
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
};

const LOOKS: Record<string, { banner: string; emoji: string }> = {
  Indian: {
    banner: "from-[#ffe8cc] via-[#ffd9b0] to-[#ffc48f]",
    emoji: "🌯",
  },
  "North Indian": {
    banner: "from-[#ffe1d0] via-[#ffcbb2] to-[#ffb392]",
    emoji: "🍛",
  },
  "South Indian": {
    banner: "from-[#e6f6e9] via-[#d3efdb] to-[#b9e3c8]",
    emoji: "🥥",
  },
  Mughlai: {
    banner: "from-[#ffe0e1] via-[#ffc9cb] to-[#ffb0b3]",
    emoji: "🍢",
  },
};

const FALLBACK = {
  banner: "from-[#fff0e5] via-[#ffe3d0] to-[#ffd2b8]",
  emoji: "🍽️",
};

export function restaurantLook(cuisine: string) {
  return LOOKS[cuisine] ?? FALLBACK;
}

export default function RestaurantCard({
  restaurant,
}: {
  restaurant: RestaurantSummary;
}) {
  const look = restaurantLook(restaurant.cuisine);

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="group block overflow-hidden rounded-2xl border border-[#f0e7df] bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e23744]"
    >
      <div
        aria-hidden="true"
        className={`flex h-28 items-center justify-center bg-gradient-to-br text-5xl ${look.banner}`}
      >
        <span className="transition-transform duration-200 group-hover:scale-110">
          {look.emoji}
        </span>
      </div>

      <div className="p-4">
        <h2 className="text-base font-semibold tracking-tight text-[#1c1917]">
          {restaurant.name}
        </h2>
        <p className="mt-0.5 text-sm text-[#78716c]">
          {restaurant.cuisine} · {restaurant.area}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <RatingBadge value={restaurant.averageRating} />
          <span className="text-xs text-[#78716c]">
            {restaurant.totalReviews}{" "}
            {restaurant.totalReviews === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>
    </Link>
  );
}
