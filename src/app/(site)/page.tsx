import Form from "next/form";
import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { publicFacets, searchPublicAssets, getSettings, PAGE_SIZE } from "@/lib/data";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const int = (v: string | string[] | undefined) => {
  const n = parseInt(str(v) ?? "", 10);
  return Number.isFinite(n) ? n : undefined;
};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters = {
    q: str(sp.q),
    category: str(sp.category),
    make: str(sp.make),
    state: str(sp.state),
    condition: str(sp.condition),
    minPrice: int(sp.min),
    maxPrice: int(sp.max),
    minYear: int(sp.year),
    sort: str(sp.sort),
    page: int(sp.page),
  };
  const [{ assets, total, page }, facets, settings] = await Promise.all([
    searchPublicAssets(filters),
    publicFacets(),
    getSettings(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const longestTerm = Math.max(...settings.estimator_terms);
  const catCounts = new Map(facets.categories.map((c) => [c.v, c.n]));
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) p.set(k, v);
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== "page" && k !== "sort" && v != null);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-100">Equipment you can finance</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Trucks and heavy equipment, ready to finance.
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Browse units from our dealer network. Every listing shows an estimated monthly payment, and you can
            apply for financing in minutes.
          </p>
          <Form action="/" className="mt-8 flex max-w-2xl flex-col gap-2 rounded-xl bg-white p-2 shadow-lg sm:flex-row">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search make, model or keyword"
              className="flex-1 rounded-lg px-3 py-2.5 text-slate-900 outline-none"
            />
            <select name="category" defaultValue={filters.category ?? ""} className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button className="btn-primary">Search</button>
          </Form>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <Form action="/" className="card space-y-4 p-4 lg:sticky lg:top-20">
            {filters.q && <input type="hidden" name="q" value={filters.q} />}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy-900">Filters</h2>
              {hasFilters && <Link href="/" className="text-xs font-semibold text-brand-600">Clear all</Link>}
            </div>
            <div>
              <label className="label" htmlFor="f-cat">Category</label>
              <select id="f-cat" name="category" defaultValue={filters.category ?? ""} className="input">
                <option value="">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}{catCounts.get(c) ? ` (${catCounts.get(c)})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-make">Make</label>
              <select id="f-make" name="make" defaultValue={filters.make ?? ""} className="input">
                <option value="">All</option>
                {facets.makes.map((m) => (
                  <option key={m.v} value={m.v}>{m.v} ({m.n})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-cond">Condition</label>
              <select id="f-cond" name="condition" defaultValue={filters.condition ?? ""} className="input">
                <option value="">New & used</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
            <div>
              <span className="label">Price ($)</span>
              <div className="flex gap-2">
                <input name="min" type="number" min={0} step={1000} placeholder="Min" defaultValue={filters.minPrice} className="input" aria-label="Minimum price" />
                <input name="max" type="number" min={0} step={1000} placeholder="Max" defaultValue={filters.maxPrice} className="input" aria-label="Maximum price" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="f-year">Year (min)</label>
              <input id="f-year" name="year" type="number" min={1950} max={2100} placeholder="e.g. 2018" defaultValue={filters.minYear} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="f-state">Location</label>
              <select id="f-state" name="state" defaultValue={filters.state ?? ""} className="input">
                <option value="">Anywhere</option>
                {facets.states.map((s) => (
                  <option key={s.v} value={s.v}>{s.v} ({s.n})</option>
                ))}
              </select>
            </div>
            <input type="hidden" name="sort" value={filters.sort ?? ""} />
            <button className="btn-navy w-full">Apply filters</button>
          </Form>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-bold text-navy-900">{total.toLocaleString()}</span> unit{total === 1 ? "" : "s"} available
            </p>
            <div className="flex flex-wrap gap-1 text-sm">
              {[
                ["", "Newest"],
                ["price_asc", "Price ↑"],
                ["price_desc", "Price ↓"],
                ["year_desc", "Year"],
                ["hours_asc", "Lowest hours"],
              ].map(([v, l]) => (
                <Link
                  key={v}
                  href={qs({ sort: v || undefined, page: undefined })}
                  className={`rounded-md px-2.5 py-1 ${
                    (filters.sort ?? "") === v ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {assets.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-lg font-bold text-navy-900">No equipment matches those filters.</p>
              <p className="mt-1 text-sm text-slate-600">Try widening your search, or check back soon — new units are added regularly.</p>
              {hasFilters && <Link href="/" className="btn-ghost mt-4">Clear filters</Link>}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((a) => (
                <AssetCard key={a.id} asset={a} apr={settings.estimator_apr} term={longestTerm} downPct={settings.estimator_default_down_pct} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && <Link className="btn-ghost" href={qs({ page: String(page - 1) })}>← Previous</Link>}
              <span className="px-3 text-sm text-slate-600">Page {page} of {pages}</span>
              {page < pages && <Link className="btn-ghost" href={qs({ page: String(page + 1) })}>Next →</Link>}
            </nav>
          )}
          <p className="mt-6 text-xs text-slate-500">
            Monthly estimates assume {settings.estimator_default_down_pct}% down, {settings.estimator_apr}% APR over {longestTerm} months.
            Actual rates and terms depend on credit approval.
          </p>
        </section>
      </div>
    </>
  );
}
