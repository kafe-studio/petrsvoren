import { writeFileSync } from "node:fs";
const enc = new TextEncoder();
const toHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return { hash: toHex(bits), salt: toHex(salt) };
}
function genPassword(len = 14) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint8Array(len));
  return [...r].map((x) => abc[x % abc.length]).join("");
}
const email = process.argv[2];
const pw = genPassword();
const { hash, salt } = await hashPassword(pw);
const esc = (s) => `'${s.replace(/'/g, "''")}'`;
const sql = `INSERT INTO admin_users (id,username,email,password_hash,password_salt,created_at) VALUES (${esc(crypto.randomUUID())},${esc(email)},${esc(email)},${esc(hash)},${esc(salt)},${Math.floor(Date.now()/1000)}) ON CONFLICT(username) DO UPDATE SET email=excluded.email, password_hash=excluded.password_hash, password_salt=excluded.password_salt;`;
writeFileSync("/tmp/add-user.sql", sql + "\n");
console.log(`${email}  ->  ${pw}`);
