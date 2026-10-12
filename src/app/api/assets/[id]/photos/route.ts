import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { loadEditableAsset } from "@/lib/permissions";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/constants";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const json = (body: unknown, status = 200) => Response.json(body, { status });

async function authorize(params: Promise<{ id: string }>) {
  const user = await getCurrentUser();
  if (!user) return null;
  const id = parseInt((await params).id, 10);
  return Number.isFinite(id) ? await loadEditableAsset(user, id) : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const asset = await authorize(params);
  if (!asset) return json({ error: "Not allowed" }, 403);
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return json({ error: "No file" }, 400);
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return json({ error: "Use JPG, PNG or WebP images." }, 415);
  if (file.size > MAX_PHOTO_BYTES) return json({ error: "Image is too large (max 8 MB)." }, 413);

  const env = await getEnv();
  const count = await env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(MAX(sort_order), -1) AS mx FROM asset_photos WHERE asset_id = ?")
    .bind(asset.id)
    .first<{ n: number; mx: number }>();
  if ((count?.n ?? 0) >= MAX_PHOTOS) return json({ error: `Maximum ${MAX_PHOTOS} photos per listing.` }, 409);

  const key = `assets/${asset.id}/${crypto.randomUUID()}.${EXT[file.type]}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const r = await env.DB.prepare("INSERT INTO asset_photos (asset_id, r2_key, content_type, sort_order) VALUES (?, ?, ?, ?)")
    .bind(asset.id, key, file.type, (count?.mx ?? -1) + 1)
    .run();
  await env.DB.prepare("UPDATE assets SET updated_at = datetime('now') WHERE id = ?").bind(asset.id).run();
  return json({ id: Number(r.meta.last_row_id), key });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const asset = await authorize(params);
  if (!asset) return json({ error: "Not allowed" }, 403);
  const photoId = Number(new URL(req.url).searchParams.get("photo"));
  const env = await getEnv();
  const p = await env.DB.prepare("SELECT r2_key FROM asset_photos WHERE id = ? AND asset_id = ?")
    .bind(photoId, asset.id)
    .first<{ r2_key: string }>();
  if (!p) return json({ error: "Not found" }, 404);
  await env.MEDIA.delete(p.r2_key);
  await env.DB.prepare("DELETE FROM asset_photos WHERE id = ?").bind(photoId).run();
  return json({ ok: true });
}
