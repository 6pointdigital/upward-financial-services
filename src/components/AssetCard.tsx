import Link from "next/link";
import type { Asset } from "@/lib/data";
import { money, num, photoUrl, monthlyPayment } from "@/lib/format";

export function AssetCard({ asset, apr, term, downPct }: { asset: Asset; apr: number; term: number; downPct: number }) {
  const est =
    asset.price_cents && asset.financing_eligible
      ? monthlyPayment((asset.price_cents / 100) * (1 - downPct / 100), apr, term)
      : null;
  return (
    <Link
      href={`/equipment/${asset.id}`}
      className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-sand-100">
        {asset.cover_key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(asset.cover_key)}
            alt={asset.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo yet</div>
        )}
        <span className="badge absolute left-3 top-3 bg-white/95 text-navy-900 shadow-sm">
          {asset.condition === "new" ? "New" : "Used"}
        </span>
        {asset.financing_eligible ? (
          <span className="badge absolute right-3 top-3 bg-brand-600 text-white shadow-sm">Financing available</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{asset.category}</p>
        <h3 className="mt-1 line-clamp-2 font-bold text-navy-900">{asset.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {[asset.year, asset.make, asset.model].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-slate-500">
          {asset.hours != null && <span>{num(asset.hours)} hrs</span>}
          {asset.mileage != null && <span>{num(asset.mileage)} mi</span>}
          {asset.location_state && (
            <span>
              {asset.location_city ? `${asset.location_city}, ` : ""}
              {asset.location_state}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          <p className="text-lg font-extrabold text-navy-900">{money(asset.price_cents)}</p>
          {est ? (
            <p className="text-right text-xs text-slate-500">
              est. <span className="text-sm font-bold text-brand-600">{money(Math.round(est * 100))}</span>/mo
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
