import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getAsset, getPhotos, listDealerships } from "@/lib/data";
import { loadEditableAsset } from "@/lib/permissions";
import { AssetForm } from "@/components/AssetForm";
import { PhotoManager } from "@/components/PhotoManager";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteAsset, markSold, reviewAsset, submitForReview } from "@/app/actions/assets";
import { date } from "@/lib/format";

export default async function EditAsset({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const id = parseInt((await params).id, 10);
  if (!Number.isFinite(id) || !(await loadEditableAsset(user, id))) notFound();
  const isAdmin = user.role === "admin";
  const [asset, photos, dealers] = await Promise.all([
    getAsset(id),
    getPhotos(id),
    isAdmin ? listDealerships() : Promise.resolve([]),
  ]);
  if (!asset) notFound();
  const created = (await searchParams).created;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/portal/assets" className="text-sm text-slate-500 hover:text-navy-900">← Back to listings</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">{asset.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <StatusBadge status={asset.status} />
            {asset.dealership_name} · updated {date(asset.updated_at)}
          </p>
        </div>
        <Link href={`/equipment/${asset.id}`} className="btn-ghost" target="_blank">
          {asset.status === "approved" ? "View live listing ↗" : "Preview listing ↗"}
        </Link>
      </div>

      {created && (
        <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-600">
          Listing created. Add photos below{isAdmin ? ", then approve it to publish." : ", then submit it for review."}
        </p>
      )}
      {asset.status === "rejected" && asset.review_note && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Upward requested changes:</strong> {asset.review_note}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <PhotoManager assetId={asset.id} photos={photos} />
          <AssetForm asset={asset} isAdmin={isAdmin} dealerships={dealers} />
        </div>

        <aside className="space-y-4">
          {isAdmin ? (
            <div className="card p-5">
              <h2 className="font-bold text-navy-900">Review & publish</h2>
              <p className="mt-1 text-xs text-slate-500">Approved listings appear in the public inventory.</p>
              <form className="mt-4 space-y-3">
                <input type="hidden" name="id" value={asset.id} />
                <div>
                  <label className="label" htmlFor="note">Note to dealer</label>
                  <textarea id="note" name="note" rows={3} defaultValue={asset.review_note ?? ""} placeholder="Required when requesting changes" className="input" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button formAction={reviewAsset.bind(null, "approve")} className="btn-primary" disabled={asset.status === "approved"}>Approve</button>
                  <button formAction={reviewAsset.bind(null, "reject")} className="btn-danger">Request changes</button>
                </div>
                {asset.status === "approved" && (
                  <button formAction={reviewAsset.bind(null, "unpublish")} className="btn-ghost w-full">Unpublish (back to draft)</button>
                )}
              </form>
              {photos.length === 0 && <p className="mt-3 text-xs text-amber-700">Heads up: this listing has no photos.</p>}
              {!asset.financing_eligible && <p className="mt-2 text-xs text-amber-700">Financing is turned off for this unit.</p>}
            </div>
          ) : (
            (asset.status === "draft" || asset.status === "rejected") && (
              <div className="card p-5">
                <h2 className="font-bold text-navy-900">Ready to go live?</h2>
                <p className="mt-1 text-sm text-slate-600">Upward reviews each listing before it appears in the public inventory.</p>
                <form action={submitForReview} className="mt-4">
                  <input type="hidden" name="id" value={asset.id} />
                  <button className="btn-primary w-full" disabled={!asset.price_cents}>Submit for review</button>
                </form>
                {!asset.price_cents && <p className="mt-2 text-xs text-amber-700">Add a price first.</p>}
              </div>
            )
          )}

          <div className="card space-y-2 p-5">
            <h2 className="font-bold text-navy-900">Other actions</h2>
            {asset.status !== "sold" && (
              <form action={markSold}>
                <input type="hidden" name="id" value={asset.id} />
                <button className="btn-ghost w-full">Mark as sold</button>
              </form>
            )}
            <form action={deleteAsset}>
              <input type="hidden" name="id" value={asset.id} />
              <ConfirmButton message="Permanently delete this listing and its photos?" className="btn-danger w-full">
                Delete listing
              </ConfirmButton>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
