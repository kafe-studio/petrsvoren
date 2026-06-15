import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DB = DrizzleD1Database<typeof schema>;

// `cloudflare:workers` importujeme DYNAMICKY — statický import rozbíjí načtení
// stránkových modulů v node prerender prostředí (astro.config prerenderEnvironment:"node").
// Dynamický import se resolvuje až za běhu ve workerd (na SSR stránce i v API routě).
export async function getDb(): Promise<DB> {
  const { env } = await import("cloudflare:workers");
  return drizzle(env.DB, { schema });
}

export { schema };
