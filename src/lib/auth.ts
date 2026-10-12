import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./env";

export const SESSION_COOKIE = "ufs_session";
const SESSION_DAYS = 14;
const PBKDF2_ITERATIONS = 100_000; // Workers runtime maximum

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "dealer";
  dealership_id: number | null;
  dealership_name: string | null;
};

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(s: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

export async function hashPassword(password: string, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return { hash: toHex(bits), salt };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const { hash: candidate } = await hashPassword(password, salt);
  return timingSafeEqual(candidate, hash);
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  return null;
}

export async function createSession(userId: number) {
  const db = await getDb();
  const token = randomHex(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), userId, expires.toISOString())
    .run();
  await db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").bind(userId).run();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.dealership_id, d.name AS dealership_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN dealerships d ON d.id = u.dealership_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .bind(await sha256(token), new Date().toISOString())
    .first<SessionUser>();
  return row ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/portal");
  return user;
}

export async function userCount(): Promise<number> {
  const db = await getDb();
  const r = await db.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  return r?.n ?? 0;
}
