"use client";

// Screen 1 — write a review.
// This file collects three facts and hands them to POST /api/reviews.
// It does not decide whether the review is allowed. The backend does that.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import StarPicker from "@/components/StarPicker";
import { restaurantLook } from "@/components/RestaurantCard";

const MAX_COMMENT = 500;

type RestaurantHeading = { name: string; cuisine: string };

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [restaurant, setRestaurant] = useState<RestaurantHeading | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHeading() {
      setLoadingName(true);
      setNameError(null);
      try {
        const response = await fetch(`/api/restaurants/${id}`, {
          cache: "no-store",
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "Could not load this restaurant.");
        }
        if (!cancelled) {
          setRestaurant({ name: body.name, cuisine: body.cuisine });
        }
      } catch (cause) {
        if (!cancelled) {
          setNameError(
            cause instanceof Error
              ? cause.message
              : "Could not load this restaurant."
          );
        }
      } finally {
        if (!cancelled) setLoadingName(false);
      }
    }

    loadHeading();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const commentIsValid = comment.trim().length > 0;
  const canSubmit = rating > 0 && commentIsValid && !sending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: Number(id),
          rating,
          comment: comment.trim(),
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Show exactly what the backend said. Do not invent our own wording.
        setError(body.error ?? "Could not save your review.");
        return;
      }

      router.push(`/restaurant/${id}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  const look = restaurant ? restaurantLook(restaurant.cuisine) : null;

  return (
    <div className="min-h-screen bg-[#fffaf7] font-sans text-[#1c1917]">
      <div className="mx-auto w-full max-w-[560px] px-4 pb-14 pt-5">
        <Link
          href={`/restaurant/${id}`}
          className="text-sm text-[#78716c] underline-offset-4 hover:text-[#1c1917] hover:underline"
        >
          ← Back to restaurant
        </Link>

        {loadingName && (
          <div role="status" aria-live="polite" className="mt-5 animate-pulse">
            <span className="sr-only">Loading restaurant</span>
            <div className="h-32 rounded-2xl bg-[#f6eee8]" />
            <div className="mt-4 h-72 rounded-2xl bg-[#f6eee8]" />
          </div>
        )}

        {!loadingName && nameError && (
          <section className="mt-5 rounded-2xl border border-[#f0d9d5] bg-white p-6">
            <h1 className="text-lg font-semibold">We couldn&apos;t load this page</h1>
            <p role="alert" className="mt-2 text-sm leading-relaxed text-[#78716c]">
              {nameError}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#e23744] px-4 text-sm font-medium text-white hover:bg-[#c81e2b]"
            >
              Back to all restaurants
            </Link>
          </section>
        )}

        {!loadingName && !nameError && restaurant && look && (
          <>
            <header
              className={`relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br p-6 ${look.banner}`}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -right-2 text-[6rem] leading-none opacity-25"
              >
                {look.emoji}
              </span>
              <div className="relative">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#7c5a45]">
                  Write a review
                </p>
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight">
                  {restaurant.name}
                </h1>
              </div>
            </header>

            <form
              onSubmit={handleSubmit}
              className="mt-4 rounded-2xl border border-[#f0e7df] bg-white p-5 shadow-sm"
            >
              <StarPicker
                value={rating}
                onChange={setRating}
                disabled={sending}
              />

              <div className="mt-7">
                <label
                  htmlFor="comment"
                  className="mb-2.5 block text-sm font-medium text-[#44403c]"
                >
                  Your review
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={5}
                  maxLength={MAX_COMMENT}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  disabled={sending}
                  placeholder="What was good? What could be better?"
                  className="w-full resize-none rounded-xl border border-[#efe5de] bg-[#fffaf7] px-4 py-3 text-base leading-relaxed text-[#1c1917] placeholder:text-[#a8a29e] focus:border-[#e23744] focus:outline-none focus:ring-2 focus:ring-[#e23744]/15 disabled:opacity-60"
                />
                <p className="mt-1.5 text-right text-xs text-[#a8a29e]">
                  {comment.length} / {MAX_COMMENT}
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-[#f0d0cb] bg-[#fff1ef] px-4 py-3 text-sm leading-relaxed text-[#a3352a]"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#e23744] text-sm font-semibold text-white transition-colors hover:bg-[#c81e2b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e23744] disabled:cursor-not-allowed disabled:bg-[#e8cfc9]"
              >
                {sending ? "Submitting…" : "Submit review"}
              </button>

              <p className="mt-3 text-center text-xs text-[#a8a29e]">
                {!commentIsValid
                  ? "Choose a star rating and write a few words."
                  : rating === 0
                    ? "Choose a star rating to continue."
                    : "Your review will appear on the restaurant page."}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
