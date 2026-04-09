import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

function sqlitePath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    return url.slice("file:".length);
  }
  return url;
}

const client = new Database(sqlitePath());
client.pragma("foreign_keys = ON");

export const db = drizzle(client, { schema });
export { schema };
