// Ověření Cloudflare Turnstile tokenu (anti-bot). Tajný klíč = Workers secret
// TURNSTILE_SECRET. Když secret není nastaven, ověření se přeskočí (graceful) —
// web funguje i bez nakonfigurovaného Turnstile.
import { env } from "cloudflare:workers";

export function turnstileEnabled(): boolean {
  return Boolean(env.TURNSTILE_SECRET);
}

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string | null,
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET;
  if (!secret) return true; // nenakonfigurováno → neblokuj
  if (!token) return false;
  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
