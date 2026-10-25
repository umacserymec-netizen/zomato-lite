-- The facts we start with.
-- One restaurant, three reviews, written a few days apart so "latest" means something.

INSERT INTO restaurants (id, name, cuisine, area)
VALUES (1, 'Ludhiana Burrito', 'Indian', 'Sector 32');

INSERT INTO reviews (id, restaurant_id, rating, comment, created_at)
VALUES
  (101, 1, 5, 'Paneer burrito is unreal', NOW() - INTERVAL '8 days'),
  (102, 1, 4, 'Good, but slow service',  NOW() - INTERVAL '6 days'),
  (103, 1, 4, 'Solid. Would repeat.',     NOW() - INTERVAL '2 days');

-- We gave the rows explicit ids, so we move the counters forward.
-- Without this, the next inserted review would try to reuse id 1.
SELECT setval(pg_get_serial_sequence('reviews', 'id'),     (SELECT MAX(id) FROM reviews));
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), (SELECT MAX(id) FROM restaurants));
