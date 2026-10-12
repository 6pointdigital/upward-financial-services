import type { SessionUser } from "./auth";
import { getDb } from "./env";

export async function loadEditableAsset(user: SessionUser, assetId: number) {
  const db = await getDb();
  const asset = await db
    .prepare("SELECT id, dealership_id, status FROM assets WHERE id = ?")
    .bind(assetId)
    .first<{ id: number; dealership_id: number; status: string }>();
  if (!asset) return null;
  if (user.role === "admin") return asset;
  if (user.dealership_id && user.dealership_id === asset.dealership_id) return asset;
  return null;
}
