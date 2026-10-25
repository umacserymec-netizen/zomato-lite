// This is the only file that knows how to reach the database.
// It reads the secret connection string from .env.local, sends the SQL in
// schema.sql and seed.sql to Neon, then prints what is now stored.
//
// Run with:  npm run db:setup
// Note: this RESETS the two tables. It is a setup script, not a migration tool.

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing. Is .env.local present?");
  process.exit(1);
}

// `sql` is a function that sends SQL to Neon and returns the rows.
const sql = neon(connectionString);

// Split a .sql file into individual statements on the semicolon.
// Our files are simple enough that no semicolon appears inside a value.
function readStatements(file) {
  const fullPath = path.join(here, file);
  return readFileSync(fullPath, "utf8")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

try {
  console.log("1. Dropping the two tables if they already exist...");
  await sql.query("DROP TABLE IF EXISTS reviews");
  await sql.query("DROP TABLE IF EXISTS restaurants");

  console.log("2. Creating the tables from db/schema.sql...");
  for (const statement of readStatements("schema.sql")) {
    await sql.query(statement);
  }

  console.log("3. Inserting the seed rows from db/seed.sql...");
  for (const statement of readStatements("seed.sql")) {
    await sql.query(statement);
  }

  console.log("\n4. Contents of the restaurants table:");
  console.table(await sql.query("SELECT * FROM restaurants ORDER BY id"));

  console.log("\n5. Contents of the reviews table:");
  console.table(
    await sql.query("SELECT * FROM reviews ORDER BY created_at DESC")
  );

  console.log("\nDone. The database now holds facts, and nothing else.");
} catch (error) {
  // Never echo the connection string, even inside an error message.
  const message = String(error?.message ?? error).replaceAll(
    connectionString,
    "[hidden]"
  );
  console.error("\nFAILED:", message);
  process.exit(1);
}
