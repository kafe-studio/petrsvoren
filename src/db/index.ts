import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export type DB = DrizzleD1Database<typeof schema>;

// Voláme až v handleru/SSR — env z cloudflare:workers se resolvuje za běhu Workeru.
export function getDb(): DB {
  return drizzle(env.DB, { schema });
}

export { schema };
