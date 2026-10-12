import { getDb } from "./env";
import type { AssetStatus } from "./constants";

export type Asset = {
  id: number;
  dealership_id: number;
  dealership_name?: string;
  dealership_city?: string | null;
  dealership_state?: string | null;
  dealership_phone?: string | null;
  title: string;
  category: string;
  make: string | null;
  model: string | null;
  year: number | null;
  condition: "new" | "used";
  price_cents: number | null;
  hours: number | null;
  mileage: number | null;
  serial_number: string | null;
  stock_number: string | null;
  location_city: string | null;
  location_state: string | null;
  description: string | null;
  status: AssetStatus;
  financing_eligible: number;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  cover_key?: string | null;
  photo_count?: number;
};

export type Photo = { id: number; asset_id: number; r2_key: string; content_type: string; sort_order: number };

export type Dealership = {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  active: number;
  created_at: string;
  asset_count?: number;
};

const ASSET_SELECT = `
  SELECT a.*, d.name AS dealership_name, d.city AS dealership_city, d.state AS dealership_state,
         d.phone AS dealership_phone,
         (SELECT r2_key FROM asset_photos p WHERE p.asset_id = a.id ORDER BY sort_order, id LIMIT 1) AS cover_key,
         (SELECT COUNT(*) FROM asset_photos p WHERE p.asset_id = a.id) AS photo_count
  FROM assets a JOIN dealerships d ON d.id = a.dealership_id`;

export type PublicFilters = {
  q?: string;
  category?: string;
  make?: string;
  state?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  sort?: string;
  page?: number;
};

export const PAGE_SIZE = 24;

export async function searchPublicAssets(f: PublicFilters) {
  const db = await getDb();
  const where: string[] = ["a.status = 'approved'", "d.active = 1"];
  const args: unknown[] = [];
  if (f.q) {
    where.push(
      "(a.title LIKE ? OR a.make LIKE ? OR a.model LIKE ? OR a.description LIKE ? OR a.category LIKE ?)",
    );
    const like = `%${f.q}%`;
    args.push(like, like, like, like, like);
  }
  if (f.category) { where.push("a.category = ?"); args.push(f.category); }
  if (f.make) { where.push("a.make = ? COLLATE NOCASE"); args.push(f.make); }
  if (f.state) { where.push("a.location_state = ?"); args.push(f.state); }
  if (f.condition === "new" || f.condition === "used") { where.push("a.condition = ?"); args.push(f.condition); }
  if (f.minPrice != null) { where.push("a.price_cents >= ?"); args.push(f.minPrice * 100); }
  if (f.maxPrice != null) { where.push("a.price_cents <= ?"); args.push(f.maxPrice * 100); }
  if (f.minYear != null) { where.push("a.year >= ?"); args.push(f.minYear); }

  const order =
    {
      price_asc: "a.price_cents IS NULL, a.price_cents ASC",
      price_desc: "a.price_cents DESC",
      year_desc: "a.year DESC",
      hours_asc: "a.hours IS NULL, a.hours ASC",
    }[f.sort ?? ""] ?? "a.reviewed_at DESC, a.id DESC";

  const page = Math.max(1, f.page ?? 1);
  const whereSql = where.join(" AND ");
  const [rows, count] = await Promise.all([
    db
      .prepare(`${ASSET_SELECT} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .bind(...args, PAGE_SIZE, (page - 1) * PAGE_SIZE)
      .all<Asset>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM assets a JOIN dealerships d ON d.id = a.dealership_id WHERE ${whereSql}`)
      .bind(...args)
      .first<{ n: number }>(),
  ]);
  return { assets: rows.results, total: count?.n ?? 0, page };
}

export async function publicFacets() {
  const db = await getDb();
  const base = "FROM assets a JOIN dealerships d ON d.id = a.dealership_id WHERE a.status = 'approved' AND d.active = 1";
  const [cats, makes, states] = await Promise.all([
    db.prepare(`SELECT a.category AS v, COUNT(*) AS n ${base} GROUP BY a.category ORDER BY n DESC`).all<{ v: string; n: number }>(),
    db.prepare(`SELECT a.make AS v, COUNT(*) AS n ${base} AND a.make IS NOT NULL AND a.make != '' GROUP BY a.make COLLATE NOCASE ORDER BY a.make`).all<{ v: string; n: number }>(),
    db.prepare(`SELECT a.location_state AS v, COUNT(*) AS n ${base} AND a.location_state IS NOT NULL GROUP BY a.location_state ORDER BY a.location_state`).all<{ v: string; n: number }>(),
  ]);
  return { categories: cats.results, makes: makes.results, states: states.results };
}

export async function getAsset(id: number): Promise<Asset | null> {
  const db = await getDb();
  return (await db.prepare(`${ASSET_SELECT} WHERE a.id = ?`).bind(id).first<Asset>()) ?? null;
}

export async function getPhotos(assetId: number): Promise<Photo[]> {
  const db = await getDb();
  const r = await db
    .prepare("SELECT * FROM asset_photos WHERE asset_id = ? ORDER BY sort_order, id")
    .bind(assetId)
    .all<Photo>();
  return r.results;
}

export async function listPortalAssets(opts: { dealershipId?: number | null; status?: string; q?: string }) {
  const db = await getDb();
  const where: string[] = ["1=1"];
  const args: unknown[] = [];
  if (opts.dealershipId) { where.push("a.dealership_id = ?"); args.push(opts.dealershipId); }
  if (opts.status) { where.push("a.status = ?"); args.push(opts.status); }
  if (opts.q) {
    where.push("(a.title LIKE ? OR a.make LIKE ? OR a.model LIKE ? OR a.stock_number LIKE ? OR a.serial_number LIKE ?)");
    const like = `%${opts.q}%`;
    args.push(like, like, like, like, like);
  }
  const r = await db
    .prepare(`${ASSET_SELECT} WHERE ${where.join(" AND ")} ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.updated_at DESC LIMIT 500`)
    .bind(...args)
    .all<Asset>();
  return r.results;
}

export async function statusCounts(dealershipId?: number | null) {
  const db = await getDb();
  const r = await db
    .prepare(
      `SELECT status, COUNT(*) AS n FROM assets ${dealershipId ? "WHERE dealership_id = ?" : ""} GROUP BY status`,
    )
    .bind(...(dealershipId ? [dealershipId] : []))
    .all<{ status: AssetStatus; n: number }>();
  const out: Record<string, number> = {};
  for (const row of r.results) out[row.status] = row.n;
  return out;
}

export async function listDealerships(activeOnly = false): Promise<Dealership[]> {
  const db = await getDb();
  const r = await db
    .prepare(
      `SELECT d.*, (SELECT COUNT(*) FROM assets a WHERE a.dealership_id = d.id) AS asset_count
       FROM dealerships d ${activeOnly ? "WHERE d.active = 1" : ""} ORDER BY d.name`,
    )
    .all<Dealership>();
  return r.results;
}

export async function getDealership(id: number): Promise<Dealership | null> {
  const db = await getDb();
  return (await db.prepare("SELECT * FROM dealerships WHERE id = ?").bind(id).first<Dealership>()) ?? null;
}

export type Settings = {
  estimator_apr: number;
  estimator_terms: number[];
  estimator_default_down_pct: number;
  notification_email: string;
};

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const r = await db.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
  const m = Object.fromEntries(r.results.map((x) => [x.key, x.value]));
  const terms = (m.estimator_terms ?? "36,48,60")
    .split(",")
    .map((t) => parseInt(t.trim(), 10))
    .filter((t) => t > 0 && t <= 120);
  return {
    estimator_apr: parseFloat(m.estimator_apr ?? "9.99") || 0,
    estimator_terms: terms.length ? terms : [36, 48, 60],
    estimator_default_down_pct: parseFloat(m.estimator_default_down_pct ?? "10") || 0,
    notification_email: m.notification_email ?? "",
  };
}
