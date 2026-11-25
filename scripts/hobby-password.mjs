// Prints the values /hobby's admin sign-in needs, for the Vercel env (or
// .env.local in development):
//
//   node scripts/hobby-password.mjs "your password"
//
// HOBBY_ADMIN_PASSWORD_HASH is a salted scrypt hash, so the password itself
// is never stored anywhere. There's no username: the password alone signs in.

import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hobby-password.mjs "your password"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
console.log(`HOBBY_ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
console.log(`HOBBY_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
