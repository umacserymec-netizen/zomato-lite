// M4.5 migration — ADDS data, never wipes it.
//   node --env-file=.env.local db/migrate-m45.mjs
//
// Safe to run more than once: every insert is guarded, so a second run
// changes nothing. Existing restaurants, reviews and menu items are kept.

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing. Is .env.local present?");
  process.exit(1);
}

const sql = neon(connectionString);

const newRestaurants = [
  { id: 2, name: "Punjabi Tadka", cuisine: "North Indian", area: "Sector 22" },
  { id: 3, name: "Madras Coffee House", cuisine: "South Indian", area: "Sector 35" },
  { id: 4, name: "Kebab Junction", cuisine: "Mughlai", area: "Model Town" },
];

// 7 items per restaurant. Restaurant 4 is deliberately all non-veg,
// so the "veg only" filter has something real to hide.
const menuItems = [
  // Ludhiana Burrito — Indian
  [1, "Paneer Tikka Burrito", 249, true, "Mains", "Paneer, mint chutney and pickled onion in a warm tortilla."],
  [1, "Aloo Tikki Burrito", 199, true, "Mains", "Crisp potato tikka, chole and cool yoghurt."],
  [1, "Chicken Makhani Burrito", 289, false, "Mains", "Butter chicken, jeera rice and cabbage slaw."],
  [1, "Masala Fries", 149, true, "Starters", "Fries tossed in chaat masala with a squeeze of lime."],
  [1, "Punjabi Nachos", 219, true, "Starters", "House nachos loaded with chole, cheese and pico de gallo."],
  [1, "Mango Lassi", 99, true, "Drinks", "Thick and cold, made with Alphonso mango pulp."],
  [1, "Gulab Jamun Cup", 129, true, "Desserts", "Two warm jamuns sitting in chilled rabri."],

  // Punjabi Tadka — North Indian
  [2, "Amritsari Kulcha", 179, true, "Starters", "Stuffed kulcha with white butter and onion chutney."],
  [2, "Tandoori Chicken (Half)", 349, false, "Starters", "Charred in the tandoor, served with mint chutney."],
  [2, "Dal Makhani", 249, true, "Mains", "Black dal simmered overnight with butter and cream."],
  [2, "Butter Chicken", 379, false, "Mains", "Tandoori chicken in a silky tomato and cream gravy."],
  [2, "Sarson Da Saag", 269, true, "Mains", "Mustard greens with makki roti and a wedge of jaggery."],
  [2, "Patiala Lassi", 119, true, "Drinks", "Served in a steel glass, thick enough to need a spoon."],
  [2, "Gajar Halwa", 139, true, "Desserts", "Slow-cooked carrot halwa with toasted almonds."],

  // Madras Coffee House — South Indian
  [3, "Medu Vada", 129, true, "Starters", "Two crisp vadas with sambar and coconut chutney."],
  [3, "Mini Idli Sambar", 149, true, "Starters", "Button idlis soaked in sambar, finished with ghee."],
  [3, "Masala Dosa", 199, true, "Mains", "Crisp dosa with spiced potato and three chutneys."],
  [3, "Chettinad Chicken Rice", 329, false, "Mains", "Peppery Chettinad curry with steamed rice."],
  [3, "Lemon Rice", 169, true, "Mains", "Curry leaves, peanuts and a generous squeeze of lemon."],
  [3, "Filter Coffee", 79, true, "Drinks", "Degree coffee in a tumbler and davara."],
  [3, "Payasam", 119, true, "Desserts", "Semiya payasam with cashews and raisins."],

  // Kebab Junction — Mughlai (no veg items at all)
  [4, "Chicken Seekh Kebab", 289, false, "Starters", "Minced chicken with green chilli, off the coal grill."],
  [4, "Mutton Galouti Kebab", 379, false, "Starters", "Melt-in-the-mouth mutton patties with sheermal."],
  [4, "Tandoori Chicken (Full)", 449, false, "Mains", "Whole bird, long marination, blistered skin."],
  [4, "Chicken Biryani", 329, false, "Mains", "Dum-cooked basmati with mint, fried onion and raita."],
  [4, "Mutton Rogan Josh", 429, false, "Mains", "Kashmiri-style curry with a slow chilli heat."],
  [4, "Chicken Korma", 359, false, "Mains", "Cashew and yoghurt gravy, mild and rich."],
  [4, "Mutton Chops", 469, false, "Mains", "Four chops, twice cooked, served with onion salad."],
];

const newReviews = [
  [201, 2, 5, "Dal makhani tasted like a Sunday at home.", 2],
  [202, 2, 4, "Kulcha was crisp, but the seating is tight.", 5],
  [203, 2, 5, "Butter chicken done properly. Will be back.", 8],

  [204, 3, 5, "Filter coffee and vadas, exactly right.", 1],
  [205, 3, 4, "Dosa was crisp but the queue is long at 9am.", 4],
  [206, 3, 4, "Good value breakfast, quick service.", 9],

  [207, 4, 4, "Seekh kebabs had a proper char on them.", 3],
  [208, 4, 5, "Mutton galouti is the reason to come here.", 6],
  [209, 4, 3, "Biryani arrived lukewarm on a Friday night.", 7],
];

try {
  console.log("1. Creating the menu_items table if it does not exist...");
  await sql.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id            SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      name          TEXT NOT NULL,
      price         INTEGER NOT NULL CHECK (price > 0),
      is_veg        BOOLEAN NOT NULL,
      category      TEXT NOT NULL,
      description   TEXT NOT NULL
    )
  `);

  console.log("2. Adding the three new restaurants (existing ones untouched)...");
  for (const r of newRestaurants) {
    await sql.query(
      `INSERT INTO restaurants (id, name, cuisine, area)
            VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.name, r.cuisine, r.area]
    );
  }

  console.log("3. Adding menu items, only where a restaurant has none yet...");
  for (const [restaurantId, name, price, isVeg, category, description] of menuItems) {
    await sql.query(
      `INSERT INTO menu_items (restaurant_id, name, price, is_veg, category, description)
       SELECT $1, $2, $3, $4, $5, $6
        WHERE NOT EXISTS (
              SELECT 1 FROM menu_items
               WHERE restaurant_id = $1 AND name = $2
        )`,
      [restaurantId, name, price, isVeg, category, description]
    );
  }

  console.log("4. Adding three reviews for each new restaurant...");
  for (const [id, restaurantId, rating, comment, daysAgo] of newReviews) {
    await sql.query(
      `INSERT INTO reviews (id, restaurant_id, rating, comment, created_at)
            VALUES ($1, $2, $3, $4, NOW() - ($5 || ' days')::interval)
       ON CONFLICT (id) DO NOTHING`,
      [id, restaurantId, rating, comment, daysAgo]
    );
  }

  console.log("5. Moving the id counters past the ids we just used...");
  await sql.query(
    `SELECT setval(pg_get_serial_sequence('restaurants', 'id'),
                   GREATEST((SELECT COALESCE(MAX(id), 1) FROM restaurants), 1))`
  );
  await sql.query(
    `SELECT setval(pg_get_serial_sequence('reviews', 'id'),
                   GREATEST((SELECT COALESCE(MAX(id), 1) FROM reviews), 1))`
  );
  await sql.query(
    `SELECT setval(pg_get_serial_sequence('menu_items', 'id'),
                   GREATEST((SELECT COALESCE(MAX(id), 1) FROM menu_items), 1))`
  );

  console.log("\n6. Restaurants:");
  console.table(await sql.query("SELECT * FROM restaurants ORDER BY id"));

  console.log("\n7. Menu items:");
  console.table(
    await sql.query(
      `SELECT id, restaurant_id, name, price, is_veg, category
         FROM menu_items ORDER BY restaurant_id, category, id`
    )
  );

  console.log("\n8. Menu counts per restaurant:");
  console.table(
    await sql.query(
      `SELECT restaurant_id, COUNT(*)::int AS items
         FROM menu_items GROUP BY restaurant_id ORDER BY restaurant_id`
    )
  );

  console.log("\n9. All reviews:");
  console.table(
    await sql.query(
      `SELECT id, restaurant_id, rating, comment, created_at
         FROM reviews ORDER BY id`
    )
  );

  console.log("\n10. Proof the M3/M4 reviews survived:");
  console.table(
    await sql.query(
      `SELECT id, comment FROM reviews WHERE id BETWEEN 101 AND 106 ORDER BY id`
    )
  );

  console.log("\nDone. Added only. Nothing was dropped or reset.");
} catch (error) {
  const message = String(error?.message ?? error).replaceAll(
    connectionString,
    "[hidden]"
  );
  console.error("\nFAILED:", message);
  process.exit(1);
}
