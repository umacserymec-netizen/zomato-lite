// GET /api/restaurants/[id]
// The restaurant page, shaped like the screen: name, big average, latest
// review, then the rest. Every number is computed fresh from the reviews
// table on each request. Nothing is stored in advance.

import { NextResponse } from "next/server";
import { sql, hideSecrets } from "@/lib/db";

function reviewShape(row: Record<string, unknown>) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId) || restaurantId < 1) {
    return NextResponse.json(
      { error: "Restaurant id must be a positive whole number." },
      { status: 400 }
    );
  }

  try {
    const [restaurant] = await sql.query(
      "SELECT id, name, cuisine, area FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (!restaurant) {
      return NextResponse.json(
        { error: `Restaurant ${restaurantId} does not exist.` },
        { status: 404 }
      );
    }

    // The whole intelligence of the product: two aggregates and one sort.
    const [stats] = await sql.query(
      `SELECT ROUND(AVG(rating)::numeric, 1) AS average_rating,
              COUNT(*)::int                    AS total_reviews
         FROM reviews
        WHERE restaurant_id = $1`,
      [restaurantId]
    );

    const rows = await sql.query(
      `SELECT id, rating, comment, created_at
         FROM reviews
        WHERE restaurant_id = $1
        ORDER BY created_at DESC, id DESC`,
      [restaurantId]
    );

    const totalReviews = stats.total_reviews as number;
    const averageRating =
      totalReviews === 0 ? null : Number(stats.average_rating);

    // The menu, grouped by category, in a fixed order a menu would use.
    const menuRows = await sql.query(
      `SELECT id, name, price, is_veg, category, description
         FROM menu_items
        WHERE restaurant_id = $1
        ORDER BY CASE category
                   WHEN 'Starters' THEN 1
                   WHEN 'Mains'    THEN 2
                   WHEN 'Desserts' THEN 3
                   WHEN 'Drinks'   THEN 4
                   ELSE 5
                 END,
                 name`,
      [restaurantId]
    );

    const menu: {
      category: string;
      items: {
        id: unknown;
        name: unknown;
        price: unknown;
        isVeg: unknown;
        description: unknown;
      }[];
    }[] = [];

    for (const row of menuRows) {
      const category = row.category as string;
      let group = menu.find((entry) => entry.category === category);
      if (!group) {
        group = { category, items: [] };
        menu.push(group);
      }
      group.items.push({
        id: row.id,
        name: row.name,
        price: row.price,
        isVeg: row.is_veg,
        description: row.description,
      });
    }

    // Newest first, so the first row is the latest review and the rest
    // are the older ones. The page shows the latest separately.
    const latestReview = rows.length > 0 ? reviewShape(rows[0]) : null;
    const reviews = rows.slice(1).map(reviewShape);

    return NextResponse.json({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      area: restaurant.area,
      averageRating,
      totalReviews,
      latestReview,
      reviews,
      menu,
    });
  } catch (error) {
    console.error("GET /api/restaurants/[id] failed:", hideSecrets(error));
    return NextResponse.json(
      { error: "Something went wrong on the server." },
      { status: 500 }
    );
  }
}
