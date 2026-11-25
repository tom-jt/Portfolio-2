/**
 * Admin sign-in for /hobby. Server only.
 *
 * Env:
 *   HOBBY_ADMIN_PASSWORD_HASH   from `node scripts/hobby-password.mjs`, never the password itself
 *   HOBBY_SESSION_SECRET        32+ random characters, signs the session cookie
 *
 * The session is a signed, httpOnly, Secure, SameSite=Strict cookie, and
 * every save checks it again on the server.
 */

import { createHmac, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "hobby_session";
const SESSION_DAYS = 7;

const secret = () => process.env.HOBBY_SESSION_SECRET ?? "";

export const authConfigured = () =>
  !!process.env.HOBBY_ADMIN_PASSWORD_HASH && secret().length >= 32;

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest();

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Hash format: scrypt:<salt hex>:<hash hex>. Colons, not dollars: Next
 *  expands $NAME inside .env files. */
async function passwordMatches(password: string) {
  const [kind, salt, hash] = (process.env.HOBBY_ADMIN_PASSWORD_HASH ?? "").split(":");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, Buffer.from(salt, "hex"), expected.length);
  return safeEqual(actual, expected);
}

/** There is one admin, so the password alone signs in. */
export async function checkPassword(password: string) {
  return authConfigured() && passwordMatches(password);
}

export async function startSession() {
  const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 864e5 }));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${payload}.${b64url(sign(payload))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Whether this request carries a valid, unexpired admin session. */
export async function isAdmin(): Promise<boolean> {
  if (!authConfigured()) return false;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return false;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac || !safeEqual(Buffer.from(mac, "base64url"), sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/** Where a request came from, for the commit trailers and rate limits. */
export async function requestInfo() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown",
    agent: (h.get("user-agent") ?? "unknown").slice(0, 200),
  };
}

// ---------------------------------------------------------------------------
// Rate limits. In memory, so per server instance: a speed bump, not a wall.
// For a real wall, add a Vercel Firewall rate-limit rule on /hobby.
// ---------------------------------------------------------------------------

const hits = new Map<string, number[]>();

/** True when `key` has had `max` hits inside the last `windowMs`. Records this one. */
export function overLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}
