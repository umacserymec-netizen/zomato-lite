"use client";

// The home page. It asks GET /api/restaurants for the list and prints what it
// gets. Search and the veg toggle are handled by the server; the cuisine chips
// simply hide cards that are already on screen.

import { useEffect, useState } from "react";
import RestaurantCard, {
  type RestaurantSummary,
} from "@/components/RestaurantCard";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [cuisine, setCuisine] = useState("All");

  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          if (query.trim()) params.set("q", query.trim());
          if (vegOnly) params.set("veg", "true");

          const response = await fetch(`/api/restaurants?${params.toString()}`, {
            cache: "no-store",
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(body.error ?? "Could not load restaurants.");
          }
          if (cancelled) return;

          setRestaurants(body.restaurants);

          // The unfiltered load is what defines the chip list.
          if (!query.trim() && !vegOnly) {
            setCuisines(
              Array.from(
                new Set(
                  (body.restaurants as RestaurantSummary[]).map(
                    (restaurant) => restaurant.cuisine
                  )
                )
              ).sort()
            );
          }
        } catch (cause) {
          if (!cancelled) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not load restaurants."
            );
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      query.trim() ? 250 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, vegOnly, reloadKey]);

  const visible = restaurants.filter(
    (restaurant) => cuisine === "All" || restaurant.cuisine === cuisine
  );

  return (
    <div className="min-h-screen bg-[#fffaf7] font-sans text-[#1c1917]">
      <header className="sticky top-0 z-20 border-b border-[#f3e9e2] bg-[#fffaf7]/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[980px] px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e23744] text-base font-bold text-white"
              >
                Z
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Zomato Lite
              </span>
            </div>
            <span className="text-xs text-[#a8a29e]">Sector 32 · Ludhiana</span>
          </div>

          <div className="relative mt-3">
            <label htmlFor="restaurant-search" className="sr-only">
              Search restaurants or cuisines
            </label>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a8a29e]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="restaurant-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurants or cuisines"
              className="h-11 w-full rounded-xl border border-[#efe5de] bg-white pl-10 pr-4 text-sm text-[#1c1917] placeholder:text-[#a8a29e] focus:border-[#e23744] focus:outline-none focus:ring-2 focus:ring-[#e23744]/15"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[980px] px-4 pb-16 pt-5">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {["All", ...cuisines].map((name) => {
            const active = cuisine === name;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => setCuisine(name)}
                className={`h-9 shrink-0 rounded-full border px-4 text-sm transition-colors ${
                  active
                    ? "border-[#e23744] bg-[#e23744] font-medium text-white"
                    : "border-[#efe5de] bg-white text-[#57534e] hover:border-[#d6c7bd]"
                }`}
              >
                {name}
              </button>
            );
          })}

          <button
            type="button"
            aria-pressed={vegOnly}
            onClick={() => setVegOnly((current) => !current)}
            className={`ml-auto flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
              vegOnly
                ? "border-[#1f7a3d] bg-[#eef7f0] font-medium text-[#1f7a3d]"
                : "border-[#efe5de] bg-white text-[#57534e] hover:border-[#d6c7bd]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                vegOnly ? "bg-[#1f7a3d]" : "bg-[#16a34a]/40"
              }`}
            />
            Veg only
          </button>
        </div>

        <p aria-live="polite" className="mt-4 text-sm text-[#78716c]">
          {loading
            ? "Finding restaurants…"
            : `${visible.length} ${
                visible.length === 1 ? "restaurant" : "restaurants"
              }`}
        </p>

        {error && (
          <section className="mt-4 rounded-2xl border border-[#f0d9d5] bg-white p-6">
            <h2 className="text-base font-semibold">We couldn&apos;t load the list</h2>
            <p role="alert" className="mt-2 text-sm leading-relaxed text-[#78716c]">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#e23744] px-4 text-sm font-medium text-white hover:bg-[#c81e2b]"
            >
              Try again
            </button>
          </section>
        )}

        {!error && loading && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2" aria-hidden="true">
            {[0, 1, 2, 3].map((card) => (
              <div
                key={card}
                className="animate-pulse overflow-hidden rounded-2xl border border-[#f0e7df] bg-white"
              >
                <div className="h-28 bg-[#f6eee8]" />
                <div className="space-y-2.5 p-4">
                  <div className="h-4 w-2/3 rounded bg-[#f0e7df]" />
                  <div className="h-3 w-1/2 rounded bg-[#f6eee8]" />
                  <div className="h-5 w-20 rounded bg-[#f0e7df]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !loading && visible.length === 0 && (
          <section className="mt-3 rounded-2xl border border-dashed border-[#e6d8ce] bg-white px-6 py-14 text-center">
            <p className="text-lg font-medium">Nothing matches that yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#78716c]">
              Try a different word, another cuisine, or turn the veg filter off.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCuisine("All");
                setVegOnly(false);
              }}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-[#efe5de] bg-white px-4 text-sm font-medium text-[#57534e] hover:border-[#d6c7bd]"
            >
              Clear all filters
            </button>
          </section>
        )}

        {!error && !loading && visible.length > 0 && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {visible.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
