// Two endpoints share this one file because they share one address:
//
//   GET  /api/reviews?restaurantId=1   read the reviews, newest first
//   POST /api/reviews                  write one new review
//
// The frontend is not trusted. Every rule is checked here, because anyone
// with a terminal can send a request without opening the app.

import { NextResponse } from "next/server";
import { sql, hideSecrets } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get("restaurantId");
  const restaurantId = Number(rawId);

  if (!rawId || !Number.isInteger(restaurantId) || restaurantId < 1) {
    return NextResponse.json(
      {
        error:
          "restaurantId must be in the address and must be a positive whole number, e.g. /api/reviews?restaurantId=1",
      },
      { status: 400 }
    );
  }

  try {
    const [restaurant] = await sql.query(
      "SELECT id FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (!restaurant) {
      return NextResponse.json(
        { error: `Restaurant ${restaurantId} does not exist.` },
        { status: 404 }
      );
    }

    const rows = await sql.query(
      `SELECT id, rating, comment, created_at
         FROM reviews
        WHERE restaurant_id = $1
        ORDER BY created_at DESC, id DESC`,
      [restaurantId]
    );

    return NextResponse.json({
      restaurantId,
      totalReviews: rows.length,
      reviews: rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("GET /api/reviews failed:", hideSecrets(error));
    return NextResponse.json(
      { error: "Something went wrong on the server." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = body ?? {};

  // Checked in this order, and the first failure wins.
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be a whole number from 1 to 5." },
      { status: 400 }
    );
  }

  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment cannot be empty." },
      { status: 400 }
    );
  }

  if (
    typeof restaurantId !== "number" ||
    !Number.isInteger(restaurantId) ||
    restaurantId < 1
  ) {
    return NextResponse.json(
      { error: "restaurantId must be a positive whole number." },
      { status: 400 }
    );
  }

  try {
    // The database lookup: the only check that needs the database to answer.
    const [restaurant] = await sql.query(
      "SELECT id FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (!restaurant) {
      return NextResponse.json(
        { error: `Restaurant ${restaurantId} does not exist.` },
        { status: 400 }
      );
    }

    const [row] = await sql.query(
      `INSERT INTO reviews (restaurant_id, rating, comment)
            VALUES ($1, $2, $3)
         RETURNING id`,
      [restaurantId, rating, comment.trim()]
    );

    return NextResponse.json(
      { success: true, reviewId: row.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reviews failed:", hideSecrets(error));
    return NextResponse.json(
      { error: "Something went wrong on the server." },
      { status: 500 }
    );
  }
}
