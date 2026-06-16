// In-app autentizace pro administraci: hashování hesla (PBKDF2) + podepsaná
// session cookie (HMAC). Vše přes Web Crypto (funguje ve Workers i v Node).

const ENC = new TextEncoder();
const PBKDF2_ITERATIONS = 100_000;
export const SESSION_COOKIE = "pv_admin";

// Superadmin smí měnit heslo komukoli; ostatní jen sobě.
export const SUPERADMIN = "kacirek.jiri@gmail.com";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dní

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// ── Hesla ─────────────────────────────────────────────────────────────────────
export async function hashPassword(
  password: string,
  saltHex?: string,
): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    ENC.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return { hash: toHex(bits), salt: toHex(salt) };
}

export async function verifyPassword(
  password: string,
  hashHex: string,
  saltHex: string,
): Promise<boolean> {
  const { hash } = await hashPassword(password, saltHex);
  // Délkově konstantní porovnání.
  if (hash.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

// ── Session (podepsaná cookie) ────────────────────────────────────────────────
async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

interface SessionPayload {
  username: string;
  exp: number;
}

export async function createSession(
  username: string,
  secret: string,
): Promise<string> {
  const payload: SessionPayload = {
    username,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = btoa(JSON.stringify(payload));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    ENC.encode(body),
  );
  return `${body}.${toHex(sig)}`;
}

export async function readSession(
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    fromHex(sig) as BufferSource,
    ENC.encode(body),
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(atob(body)) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
