"use server";
import { getDb } from "@/lib/env";

export type FinancingState = { ok?: boolean; error?: string };

const clip = (v: FormDataEntryValue | null, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function submitFinancingRequest(_prev: FinancingState, fd: FormData): Promise<FinancingState> {
  // Honeypot: real users never fill this hidden field.
  if (clip(fd.get("website"))) return { ok: true };

  const assetId = parseInt(clip(fd.get("asset_id")), 10);
  const fullName = clip(fd.get("full_name"), 120);
  const email = clip(fd.get("email"), 160);
  const phone = clip(fd.get("phone"), 40);
  if (!fullName) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (!phone) return { error: "Please enter a phone number so we can reach you." };
  if (fd.get("consent") !== "on") return { error: "Please confirm we may contact you about financing." };

  const down = parseFloat(clip(fd.get("down_payment")).replace(/[$,]/g, ""));
  const term = parseInt(clip(fd.get("term_months")), 10);

  const db = await getDb();
  const asset = Number.isFinite(assetId)
    ? await db.prepare("SELECT id FROM assets WHERE id = ? AND status = 'approved'").bind(assetId).first()
    : null;

  await db
    .prepare(
      `INSERT INTO financing_requests
        (asset_id, full_name, company, email, phone, state, down_payment_cents, term_months, years_in_business, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      asset ? assetId : null,
      fullName,
      clip(fd.get("company"), 160) || null,
      email,
      phone,
      clip(fd.get("state"), 2) || null,
      Number.isFinite(down) && down >= 0 ? Math.round(down * 100) : null,
      Number.isFinite(term) ? term : null,
      clip(fd.get("years_in_business"), 20) || null,
      clip(fd.get("message"), 2000) || null,
    )
    .run();
  return { ok: true };
}
