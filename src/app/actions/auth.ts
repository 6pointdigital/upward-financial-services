"use server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/env";
import { createSession, hashPassword, userCount, validatePassword, verifyPassword } from "@/lib/auth";

export type FormState = { error?: string };

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function login(_p: FormState, fd: FormData): Promise<FormState> {
  const email = s(fd.get("email")).toLowerCase();
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  const db = await getDb();
  const user = await db
    .prepare("SELECT id, password_hash, password_salt, active FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number; password_hash: string; password_salt: string; active: number }>();
  // Always run a hash so response timing doesn't reveal whether the account exists.
  const ok = user
    ? await verifyPassword(password, user.password_hash, user.password_salt)
    : (await hashPassword(password), false);
  if (!user || !ok || !user.active) return { error: "Incorrect email or password." };
  await createSession(user.id);
  redirect("/portal");
}

export async function setupFirstAdmin(_p: FormState, fd: FormData): Promise<FormState> {
  if ((await userCount()) > 0) return { error: "Setup has already been completed. Please log in." };
  const name = s(fd.get("name"));
  const email = s(fd.get("email")).toLowerCase();
  const password = (fd.get("password") as string) ?? "";
  if (!name) return { error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  const pwErr = validatePassword(password);
  if (pwErr) return { error: pwErr };
  if (password !== fd.get("confirm")) return { error: "Passwords don’t match." };
  const { hash, salt } = await hashPassword(password);
  const db = await getDb();
  const r = await db
    .prepare("INSERT INTO users (email, name, role, password_hash, password_salt) VALUES (?, ?, 'admin', ?, ?)")
    .bind(email, name, hash, salt)
    .run();
  await createSession(Number(r.meta.last_row_id));
  redirect("/portal");
}
