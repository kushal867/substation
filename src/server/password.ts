import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Hash format: scrypt:<saltHex>:<hashHex>. Generate with `npm run admin:hash -- "your password"`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function checkPassword(input: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const [kind, saltHex, hashHex] = hash.split(":");
    if (kind !== "scrypt" || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(input, Buffer.from(saltHex, "hex"), expected.length);
    return timingSafeEqual(actual, expected);
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (plain) {
    const a = Buffer.from(input);
    const b = Buffer.from(plain);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return false;
}

export function authConfigured() {
  return !!(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD) && (process.env.SESSION_SECRET ?? "").length >= 32;
}
