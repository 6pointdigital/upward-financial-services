"use server";
import { revalidatePath } from "next/cache";
import { hashPassword, requireAdmin, requireUser, validatePassword, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/env";
import { US_STATES } from "@/lib/constants";

export type AdminState = { error?: string; ok?: string };
const s = (fd: FormData, k: string, max = 200) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

export async function saveDealership(_p: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = Number(s(fd, "id")) || null;
  const name = s(fd, "name", 120);
  if (!name) return { error: "Dealership name is required." };
  const state = s(fd, "state").toUpperCase();
  if (state && !(US_STATES as readonly string[]).includes(state)) return { error: "Invalid state." };
  let website = s(fd, "website", 200);
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  const vals = [
    name,
    s(fd, "contact_name", 120) || null,
    s(fd, "email", 160) || null,
    s(fd, "phone", 40) || null,
    website || null,
    s(fd, "city", 80) || null,
    state || null,
    fd.get("active") === "on" ? 1 : 0,
  ];
  const db = await getDb();
  if (id) {
    await db
      .prepare("UPDATE dealerships SET name=?, contact_name=?, email=?, phone=?, website=?, city=?, state=?, active=? WHERE id=?")
      .bind(...vals, id)
      .run();
  } else {
    await db
      .prepare("INSERT INTO dealerships (name, contact_name, email, phone, website, city, state, active) VALUES (?,?,?,?,?,?,?,?)")
      .bind(...vals)
      .run();
  }
  revalidatePath("/", "layout");
  return { ok: id ? "Dealership saved." : `Added ${name}.` };
}

export async function createUser(_p: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const name = s(fd, "name", 120);
  const email = s(fd, "email", 160).toLowerCase();
  const role = s(fd, "role") === "admin" ? "admin" : "dealer";
  const dealershipId = role === "dealer" ? Number(s(fd, "dealership_id")) || null : null;
  const password = (fd.get("password") as string) ?? "";
  if (!name) return { error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (role === "dealer" && !dealershipId) return { error: "Dealer users must be linked to a dealership." };
  const pwErr = validatePassword(password);
  if (pwErr) return { error: pwErr };
  const db = await getDb();
  if (await db.prepare("SELECT 1 FROM users WHERE email = ?").bind(email).first())
    return { error: "A user with that email already exists." };
  const { hash, salt } = await hashPassword(password);
  await db
    .prepare("INSERT INTO users (email, name, role, dealership_id, password_hash, password_salt) VALUES (?,?,?,?,?,?)")
    .bind(email, name, role, dealershipId, hash, salt)
    .run();
  revalidatePath("/portal/users");
  return { ok: `Created ${email}. Share the temporary password with them securely.` };
}

export async function updateUser(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const action = String(fd.get("op"));
  const db = await getDb();
  if (action === "toggle" && id !== admin.id) {
    await db.prepare("UPDATE users SET active = 1 - active WHERE id = ?").bind(id).run();
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
  }
  revalidatePath("/portal/users");
}

export async function resetUserPassword(_p: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const password = (fd.get("password") as string) ?? "";
  const pwErr = validatePassword(password);
  if (pwErr) return { error: pwErr };
  const { hash, salt } = await hashPassword(password);
  const db = await getDb();
  await db.batch([
    db.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").bind(hash, salt, id),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
  ]);
  return { ok: "Password reset. They’ve been signed out everywhere." };
}

export async function changeOwnPassword(_p: AdminState, fd: FormData): Promise<AdminState> {
  const user = await requireUser();
  const db = await getDb();
  const row = await db
    .prepare("SELECT password_hash, password_salt FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ password_hash: string; password_salt: string }>();
  if (!row || !(await verifyPassword((fd.get("current") as string) ?? "", row.password_hash, row.password_salt)))
    return { error: "Current password is incorrect." };
  const next = (fd.get("password") as string) ?? "";
  const pwErr = validatePassword(next);
  if (pwErr) return { error: pwErr };
  if (next !== fd.get("confirm")) return { error: "New passwords don’t match." };
  const { hash, salt } = await hashPassword(next);
  await db.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").bind(hash, salt, user.id).run();
  return { ok: "Password updated." };
}

export async function updateRequestStatus(status: string, fd: FormData) {
  await requireAdmin();
  if (!["new", "contacted", "closed"].includes(status)) return;
  const db = await getDb();
  await db.prepare("UPDATE financing_requests SET status = ? WHERE id = ?").bind(status, Number(fd.get("id"))).run();
  revalidatePath("/portal/requests");
}

export async function saveSettings(_p: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const apr = parseFloat(s(fd, "estimator_apr"));
  const down = parseFloat(s(fd, "estimator_default_down_pct"));
  const terms = s(fd, "estimator_terms")
    .split(/[,\s]+/)
    .map((t) => parseInt(t, 10))
    .filter((t) => t > 0 && t <= 120);
  if (!(apr >= 0 && apr <= 40)) return { error: "APR must be between 0 and 40." };
  if (!(down >= 0 && down <= 90)) return { error: "Down payment must be between 0 and 90%." };
  if (!terms.length) return { error: "Enter at least one term in months." };
  const db = await getDb();
  const up = (k: string, v: string) =>
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(k, v);
  await db.batch([
    up("estimator_apr", String(apr)),
    up("estimator_default_down_pct", String(down)),
    up("estimator_terms", [...new Set(terms)].sort((a, b) => a - b).join(",")),
  ]);
  revalidatePath("/", "layout");
  return { ok: "Settings saved." };
}
