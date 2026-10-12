import { getEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!/^assets\/\d+\/[\w-]+\.(jpg|png|webp)$/.test(key)) return new Response("Not found", { status: 404 });
  const env = await getEnv();
  const row = await env.DB.prepare(
    "SELECT a.status, a.dealership_id FROM asset_photos p JOIN assets a ON a.id = p.asset_id WHERE p.r2_key = ?",
  )
    .bind(key)
    .first<{ status: string; dealership_id: number }>();
  if (!row) return new Response("Not found", { status: 404 });
  const isPublic = row.status === "approved" || row.status === "sold";
  if (!isPublic) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.dealership_id !== row.dealership_id))
      return new Response("Not found", { status: 404 });
  }
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": isPublic ? "public, max-age=86400" : "private, max-age=300",
      ETag: obj.httpEtag,
    },
  });
}
