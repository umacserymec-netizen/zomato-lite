// GET /api/restaurants
// The home page's shopping list: every restaurant, with its average and
// review count calculated live from the reviews table.
//
// Filters (both optional):
//   ?q=burrito        search by restaurant name or cuisine
//   ?veg=true         only restaurants that have at least one veg menu item

import { NextResponse } from "next/server";
import { sql, hideSecrets } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const vegOnly = searchParams.get("veg") === "true";

  try {
    const rows = await sql.query(
      `SELECT r.id,
              r.name,
              r.cuisine,
              r.area,
              ROUND(AVG(rv.rating)::numeric, 1) AS average_rating,
              COUNT(rv.id)::int                AS total_reviews
         FROM restaurants r
         LEFT JOIN reviews rv ON rv.restaurant_id = r.id
        WHERE ($1 = '' OR r.name ILIKE '%' || $1 || '%' OR r.cuisine ILIKE '%' || $1 || '%')
          AND ($2 = FALSE OR EXISTS (
                SELECT 1 FROM menu_items m
                 WHERE m.restaurant_id = r.id AND m.is_veg = TRUE
              ))
        GROUP BY r.id, r.name, r.cuisine, r.area
        ORDER BY r.name`,
      [q, vegOnly]
    );

    return NextResponse.json({
      restaurants: rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        name: row.name,
        cuisine: row.cuisine,
        area: row.area,
        averageRating:
          row.total_reviews === 0 ? null : Number(row.average_rating),
        totalReviews: row.total_reviews,
      })),
    });
  } catch (error) {
    console.error("GET /api/restaurants failed:", hideSecrets(error));
    return NextResponse.json(
      { error: "Something went wrong on the server." },
      { status: 500 }
    );
  }
}
