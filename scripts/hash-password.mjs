// Usage: npm run admin:hash -- "your strong password"
import { randomBytes, scryptSync } from "node:crypto";
const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('Usage: npm run admin:hash -- "a password of at least 10 characters"');
  process.exit(1);
}
const salt = randomBytes(16);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${scryptSync(pw, salt, 64).toString("hex")}`);
