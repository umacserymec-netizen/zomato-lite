"use client";

// Screen 2 — the restaurant page.
// It fetches /api/restaurants/[id] and prints what it receives: the average,
// the review count, the latest review and the menu, all shaped by the backend.
// There is no average calculation anywhere in this file.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RatingBadge from "@/components/RatingBadge";
import Stars from "@/components/Stars";
import { restaurantLook } from "@/components/RestaurantCard";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type MenuItem = {
  id: number;
  name: string;
  price: number;
  isVeg: boolean;
  description: string;
};

type MenuGroup = {
  category: string;
  items: MenuItem[];
};

type Restaurant = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
  menu: MenuGroup[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function VegMark({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      role="img"
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
        isVeg ? "border-[#1f7a3d]" : "border-[#c0392b]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isVeg ? "bg-[#1f7a3d]" : "bg-[#c0392b]"
        }`}
      />
    </span>
  );
}

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"menu" | "reviews">("menu");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/restaurants/${id}`, {
          cache: "no-store",
        });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(body.error ?? "Could not load this restaurant.");
        }
        if (!cancelled) setData(body as Restaurant);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load this restaurant."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#fffaf7] font-sans text-[#1c1917]">
      <div className="mx-auto w-full max-w-[640px] px-4 pb-28 pt-5 sm:pb-12">
        <Link
          href="/"
          className="text-sm text-[#78716c] underline-offset-4 hover:text-[#1c1917] hover:underline"
        >
          ← All restaurants
        </Link>

        {loading && (
          <div role="status" aria-live="polite" className="mt-5 animate-pulse">
            <span className="sr-only">Loading restaurant</span>
            <div className="h-40 rounded-2xl bg-[#f6eee8]" />
            <div className="mt-5 h-12 rounded-xl bg-[#f6eee8]" />
            <div className="mt-5 space-y-3">
              <div className="h-16 rounded-xl bg-[#f6eee8]" />
              <div className="h-16 rounded-xl bg-[#f6eee8]" />
            </div>
          </div>
        )}

        {!loading && error && (
          <section className="mt-5 rounded-2xl border border-[#f0d9d5] bg-white p-6">
            <h1 className="text-lg font-semibold">We couldn&apos;t load this page</h1>
            <p role="alert" className="mt-2 text-sm leading-relaxed text-[#78716c]">
              {error}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#e23744] px-4 text-sm font-medium text-white hover:bg-[#c81e2b]"
            >
              Back to all restaurants
            </Link>
          </section>
        )}

        {!loading && !error && data && (
          <>
            <header
              className={`relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br p-6 ${restaurantLook(data.cuisine).banner}`}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -right-2 text-[7rem] leading-none opacity-25"
              >
                {restaurantLook(data.cuisine).emoji}
              </span>
              <div className="relative">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#7c5a45]">
                  {data.cuisine}
                </p>
                <h1 className="mt-1.5 text-3xl font-bold tracking-tight">
                  {data.name}
                </h1>
                <p className="mt-1 text-sm text-[#6f5a4c]">{data.area}</p>

                <div className="mt-4 flex items-center gap-2.5">
                  <RatingBadge value={data.averageRating} size="lg" />
                  <span className="text-sm text-[#6f5a4c]">
                    {data.totalReviews}{" "}
                    {data.totalReviews === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
            </header>

            <Link
              href={`/review/${id}`}
              className="mt-4 hidden h-11 w-full items-center justify-center rounded-xl bg-[#e23744] text-sm font-semibold text-white transition-colors hover:bg-[#c81e2b] sm:flex"
            >
              Write a review
            </Link>

            <div className="sticky top-0 z-10 -mx-4 mt-5 bg-[#fffaf7]/95 px-4 py-2 backdrop-blur">
              <div
                role="tablist"
                aria-label="Restaurant sections"
                className="flex rounded-xl border border-[#f0e7df] bg-white p-1"
              >
                <button
                  role="tab"
                  type="button"
                  aria-selected={tab === "menu"}
                  onClick={() => setTab("menu")}
                  className={`h-10 flex-1 rounded-lg text-sm font-medium transition-colors ${
                    tab === "menu"
                      ? "bg-[#e23744] text-white"
                      : "text-[#57534e] hover:bg-[#faf3ef]"
                  }`}
                >
                  Menu
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={tab === "reviews"}
                  onClick={() => setTab("reviews")}
                  className={`h-10 flex-1 rounded-lg text-sm font-medium transition-colors ${
                    tab === "reviews"
                      ? "bg-[#e23744] text-white"
                      : "text-[#57534e] hover:bg-[#faf3ef]"
                  }`}
                >
                  Reviews
                </button>
              </div>
            </div>

            {tab === "menu" && (
              <section aria-label="Menu" className="mt-3">
                {data.menu.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-[#e6d8ce] bg-white px-6 py-10 text-center text-sm text-[#78716c]">
                    The menu is being written. Check back soon.
                  </p>
                )}

                {data.menu.map((group) => (
                  <div key={group.category} className="mt-5">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a8a29e]">
                      {group.category}
                    </h2>
                    <ul className="mt-1 divide-y divide-[#f4ece6] rounded-2xl border border-[#f0e7df] bg-white px-4">
                      {group.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start justify-between gap-4 py-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <VegMark isVeg={item.isVeg} />
                              <h3 className="text-sm font-medium">{item.name}</h3>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-[#78716c]">
                              {item.description}
                            </p>
                          </div>
                          <span className="whitespace-nowrap text-sm font-medium">
                            ₹{item.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}

            {tab === "reviews" && (
              <section aria-label="Reviews" className="mt-3">
                {data.averageRating === null ? (
                  <div className="rounded-2xl border border-dashed border-[#e6d8ce] bg-white px-6 py-12 text-center">
                    <p className="text-lg font-medium">No reviews yet. Be the first.</p>
                    <p className="mt-1.5 text-sm text-[#78716c]">
                      {data.name} is waiting for its first honest opinion.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-4 rounded-2xl border border-[#f0e7df] bg-white p-5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a8a29e]">
                          Average rating
                        </p>
                        <p className="mt-1 text-4xl font-bold leading-none">
                          {data.averageRating}
                          <span className="ml-1 text-sm font-normal text-[#78716c]">
                            / 5
                          </span>
                        </p>
                      </div>
                      <p className="pb-1 text-sm text-[#78716c]">
                        {data.totalReviews}{" "}
                        {data.totalReviews === 1 ? "review" : "reviews"}
                      </p>
                    </div>

                    {data.latestReview && (
                      <div className="mt-4 rounded-2xl border border-[#f5d9d4] bg-[#fff4f2] p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c2453a]">
                          Latest review
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <Stars value={data.latestReview.rating} />
                          <span className="text-xs text-[#a8a29e]">
                            {formatDate(data.latestReview.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2.5 text-base leading-relaxed">
                          {data.latestReview.comment}
                        </p>
                      </div>
                    )}

                    {data.reviews.length > 0 && (
                      <ul className="mt-4 divide-y divide-[#f4ece6] rounded-2xl border border-[#f0e7df] bg-white px-5">
                        {data.reviews.map((review) => (
                          <li key={review.id} className="py-4">
                            <div className="flex items-center justify-between gap-3">
                              <Stars value={review.rating} />
                              <span className="text-xs text-[#a8a29e]">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-[#44403c]">
                              {review.comment}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#f0e7df] bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link
          href={`/review/${id}`}
          className="mx-auto flex h-12 w-full max-w-[608px] items-center justify-center rounded-xl bg-[#e23744] text-sm font-semibold text-white"
        >
          Write a review
        </Link>
      </div>
    </div>
  );
}
