// The app's single door to the database.
// Every API route imports `sql` from this file, so the connection string
// is read in exactly one place and never leaves the server.

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local locally, and to the Vercel project settings in production."
  );
}

export const sql = neon(connectionString);

// Error messages can contain the connection string. Before anything is logged
// or returned, replace that whole string with the word [hidden].
export function hideSecrets(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.split(connectionString).join("[hidden]");
}
