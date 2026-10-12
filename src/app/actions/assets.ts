"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { getDb, getEnv } from "@/lib/env";
import { loadEditableAsset } from "@/lib/permissions";
import { CATEGORIES, US_STATES } from "@/lib/constants";

export type AssetFormState = { error?: string; saved?: boolean };

const s = (fd: FormData, k: string, max = 200) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const optInt = (fd: FormData, k: string) => {
  const raw = s(fd, k).replace(/[,\s]/g, "");
  if (!raw) return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

export async function saveAsset(_p: AssetFormState, fd: FormData): Promise<AssetFormState> {
  const user = await requireUser();
  const db = await getDb();
  const id = optInt(fd, "id");
  const intent = s(fd, "intent"); // "draft" | "submit" | "save"

  const title = s(fd, "title", 140);
  const category = s(fd, "category");
  const condition = s(fd, "condition") === "new" ? "new" : "used";
  const year = optInt(fd, "year");
  const priceRaw = s(fd, "price").replace(/[$,\s]/g, "");
  const price = priceRaw ? Math.round(Number(priceRaw) * 100) : null;
  const hours = optInt(fd, "hours");
  const mileage = optInt(fd, "mileage");
  const state = s(fd, "location_state").toUpperCase();

  if (!title) return { error: "Title is required." };
  if (!(CATEGORIES as readonly string[]).includes(category)) return { error: "Choose a category." };
  if (year !== null && (Number.isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2))
    return { error: "Year looks invalid." };
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { error: "Price must be a number." };
  if (Number.isNaN(hours) || Number.isNaN(mileage)) return { error: "Hours and mileage must be whole numbers." };
  if (state && !(US_STATES as readonly string[]).includes(state)) return { error: "Choose a valid state." };
  if (intent === "submit" && price === null) return { error: "Add a price before submitting for review." };

  let dealershipId: number;
  if (user.role === "admin") {
    dealershipId = Number(s(fd, "dealership_id"));
    const d = await db.prepare("SELECT id FROM dealerships WHERE id = ?").bind(dealershipId).first();
    if (!d) return { error: "Choose a dealership." };
  } else {
    if (!user.dealership_id) return { error: "Your account isn’t linked to a dealership. Contact Upward." };
    dealershipId = user.dealership_id;
  }

  const fields = {
    dealership_id: dealershipId,
    title,
    category,
    make: s(fd, "make", 80) || null,
    model: s(fd, "model", 80) || null,
    year,
    condition,
    price_cents: price,
    hours,
    mileage,
    serial_number: s(fd, "serial_number", 60) || null,
    stock_number: s(fd, "stock_number", 60) || null,
    location_city: s(fd, "location_city", 80) || null,
    location_state: state || null,
    description: s(fd, "description", 8000) || null,
  } as Record<string, unknown>;

  if (user.role === "admin") {
    fields.financing_eligible = fd.get("financing_eligible") === "on" ? 1 : 0;
  }

  let assetId: number;
  if (id) {
    const existing = await loadEditableAsset(user, id);
    if (!existing) return { error: "Listing not found." };
    // Dealers editing a listing send it back for review; admins keep the current status.
    if (user.role === "dealer") {
      if (intent === "submit" || existing.status === "approved" || existing.status === "pending" || existing.status === "rejected")
        fields.status = intent === "draft" ? "draft" : "pending";
    }
    const cols = Object.keys(fields);
    await db
      .prepare(`UPDATE assets SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`)
      .bind(...cols.map((c) => fields[c]), id)
      .run();
    assetId = id;
  } else {
    fields.status = user.role === "admin" ? "draft" : intent === "submit" ? "pending" : "draft";
    fields.created_by = user.id;
    const cols = Object.keys(fields);
    const r = await db
      .prepare(`INSERT INTO assets (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`)
      .bind(...cols.map((c) => fields[c]))
      .run();
    assetId = Number(r.meta.last_row_id);
  }
  revalidatePath("/", "layout");
  if (!id) redirect(`/portal/assets/${assetId}?created=1`);
  return { saved: true };
}

export async function submitForReview(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const a = await loadEditableAsset(user, id);
  if (!a) return;
  const db = await getDb();
  await db.prepare("UPDATE assets SET status = 'pending', updated_at = datetime('now') WHERE id = ? AND price_cents IS NOT NULL").bind(id).run();
  revalidatePath("/", "layout");
}

export async function reviewAsset(decision: "approve" | "reject" | "unpublish", fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const note = typeof fd.get("note") === "string" ? (fd.get("note") as string).trim().slice(0, 1000) : "";
  const status = ({ approve: "approved", reject: "rejected", unpublish: "draft" } as Record<string, string>)[decision];
  if (!status) return;
  const finalNote = status === "rejected" && !note ? "Changes requested — please contact Upward for details." : note;
  const db = await getDb();
  await db
    .prepare(
      `UPDATE assets SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(status, (status === "approved" ? "" : finalNote) || null, admin.id, id)
    .run();
  revalidatePath("/", "layout");
}

export async function markSold(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  if (!(await loadEditableAsset(user, id))) return;
  const db = await getDb();
  await db.prepare("UPDATE assets SET status = 'sold', updated_at = datetime('now') WHERE id = ?").bind(id).run();
  revalidatePath("/", "layout");
}

export async function deleteAsset(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  if (!(await loadEditableAsset(user, id))) return;
  const env = await getEnv();
  const photos = await env.DB.prepare("SELECT r2_key FROM asset_photos WHERE asset_id = ?").bind(id).all<{ r2_key: string }>();
  if (photos.results.length) await env.MEDIA.delete(photos.results.map((p) => p.r2_key));
  await env.DB.batch([
    env.DB.prepare("DELETE FROM asset_photos WHERE asset_id = ?").bind(id),
    env.DB.prepare("UPDATE financing_requests SET asset_id = NULL WHERE asset_id = ?").bind(id),
    env.DB.prepare("DELETE FROM assets WHERE id = ?").bind(id),
  ]);
  revalidatePath("/", "layout");
  redirect("/portal/assets");
}

export async function makeCoverPhoto(fd: FormData) {
  const user = await requireUser();
  const assetId = Number(fd.get("asset_id"));
  const photoId = Number(fd.get("photo_id"));
  if (!(await loadEditableAsset(user, assetId))) return;
  const db = await getDb();
  await db.batch([
    db.prepare("UPDATE asset_photos SET sort_order = sort_order + 1 WHERE asset_id = ?").bind(assetId),
    db.prepare("UPDATE asset_photos SET sort_order = 0 WHERE id = ? AND asset_id = ?").bind(photoId, assetId),
  ]);
  revalidatePath("/", "layout");
}
