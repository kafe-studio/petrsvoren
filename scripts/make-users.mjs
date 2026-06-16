// Vytvoří dva admin účty (username = e-mail) s vygenerovaným heslem.
// Hash = PBKDF2 SHA-256, 100000 iterací, 16B salt, hex — shodně s src/lib/auth.ts.
import { writeFileSync } from "node:fs";
const enc = new TextEncoder();
const toHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return { hash: toHex(bits), salt: toHex(salt) };
}

function genPassword(len = 14) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint8Array(len));
  return [...r].map((x) => abc[x % abc.length]).join("");
}

const emails = ["kacirek.jiri@gmail.com", "petr.svoren@volny.cz"];
const nowSec = Math.floor(Date.now() / 1000);
const esc = (s) => `'${s.replace(/'/g, "''")}'`;
const sql = ["DELETE FROM admin_users;"];
for (const email of emails) {
  const pw = genPassword();
  const { hash, salt } = await hashPassword(pw);
  const id = crypto.randomUUID();
  sql.push(
    `INSERT INTO admin_users (id,username,email,password_hash,password_salt,created_at) VALUES (${esc(id)},${esc(email)},${esc(email)},${esc(hash)},${esc(salt)},${nowSec});`
  );
  console.log(`${email}  ->  ${pw}`);
}
writeFileSync("/tmp/users.sql", sql.join("\n") + "\n");
