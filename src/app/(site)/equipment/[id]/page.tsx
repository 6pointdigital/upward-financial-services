import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAsset, getPhotos, getSettings } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { money, num } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";
import { Gallery } from "@/components/Gallery";
import { PaymentEstimator } from "@/components/PaymentEstimator";
import { FinancingForm } from "@/components/FinancingForm";

export const dynamic = "force-dynamic";

async function load(idParam: string) {
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return null;
  const asset = await getAsset(id);
  if (!asset) return null;
  const isPublic = asset.status === "approved" || asset.status === "sold";
  if (!isPublic) {
    const user = await getCurrentUser();
    const canPreview = user && (user.role === "admin" || user.dealership_id === asset.dealership_id);
    if (!canPreview) return null;
  }
  return asset;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const asset = await load((await params).id);
  if (!asset) return { title: "Not found" };
  return {
    title: asset.title,
    description: `${asset.title} — ${asset.category}${asset.location_state ? ` in ${asset.location_state}` : ""}. ${money(asset.price_cents)}. Financing available through Upward Financial Services.`,
  };
}

export default async function EquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const asset = await load((await params).id);
  if (!asset) notFound();
  const [photos, settings] = await Promise.all([getPhotos(asset.id), getSettings()]);
  const isLive = asset.status === "approved";
  const canFinance = isLive && !!asset.financing_eligible;

  const specs: [string, string | null][] = [
    ["Category", asset.category],
    ["Year", asset.year ? String(asset.year) : null],
    ["Make", asset.make],
    ["Model", asset.model],
    ["Condition", asset.condition === "new" ? "New" : "Used"],
    ["Hours", asset.hours != null ? num(asset.hours) : null],
    ["Mileage", asset.mileage != null ? `${num(asset.mileage)} mi` : null],
    ["Serial / VIN", asset.serial_number],
    ["Stock #", asset.stock_number],
    ["Location", [asset.location_city, asset.location_state].filter(Boolean).join(", ") || null],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {!isLive && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {asset.status === "sold" ? (
            <>This unit has been sold.</>
          ) : (
            <>
              <strong>Preview only.</strong> Status: {STATUS_LABELS[asset.status]}. This listing isn’t visible to the public
              until it’s approved. <Link className="underline" href={`/portal/assets/${asset.id}`}>Back to portal</Link>
            </>
          )}
        </div>
      )}
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-navy-900">Inventory</Link>
        <span className="mx-2">/</span>
        <Link href={`/?category=${encodeURIComponent(asset.category)}`} className="hover:text-navy-900">{asset.category}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Gallery keys={photos.map((p) => p.r2_key)} title={asset.title} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-navy-900 text-white">{asset.condition === "new" ? "New" : "Used"}</span>
              {canFinance && <span className="badge bg-brand-100 text-brand-600">Financing available</span>}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{asset.title}</h1>
            <p className="mt-2 text-3xl font-extrabold text-navy-900">{money(asset.price_cents)}</p>
            {canFinance && (
              <div className="mt-3 flex gap-2 lg:hidden">
                {asset.price_cents ? <a href="#estimator" className="btn-ghost">Estimate payment</a> : null}
                <a href="#apply" className="btn-primary">Apply for financing</a>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-900">Specifications</h2>
            <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
              {specs.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {asset.description && (
            <div className="card p-5">
              <h2 className="font-bold text-navy-900">Description</h2>
              <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{asset.description}</div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-bold text-navy-900">Offered by</h2>
            <p className="mt-1 font-semibold text-slate-900">{asset.dealership_name}</p>
            <p className="text-sm text-slate-600">
              {[asset.dealership_city, asset.dealership_state].filter(Boolean).join(", ")}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Financing is provided by Upward Financial Services. Apply here and we’ll coordinate with the dealer.
            </p>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {canFinance && asset.price_cents ? (
            <PaymentEstimator
              price={asset.price_cents / 100}
              apr={settings.estimator_apr}
              terms={settings.estimator_terms}
              downPct={settings.estimator_default_down_pct}
            />
          ) : null}
          {canFinance ? (
            <FinancingForm assetId={asset.id} assetTitle={asset.title} terms={settings.estimator_terms} />
          ) : isLive ? (
            <div className="card p-5 text-sm text-slate-600">
              This unit isn’t currently eligible for Upward financing. Contact the dealer for purchase options.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
