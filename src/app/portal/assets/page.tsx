import Link from "next/link";
import Form from "next/form";
import { requireUser } from "@/lib/auth";
import { listDealerships, listPortalAssets } from "@/lib/data";
import { ASSET_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { date, money, photoUrl } from "@/lib/format";

type SP = Record<string, string | undefined>;

export default async function PortalAssets({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const isAdmin = user.role === "admin";
  const status = (ASSET_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const dealershipId = isAdmin ? (sp.dealer ? Number(sp.dealer) : undefined) : user.dealership_id;
  const [assets, dealers] = await Promise.all([
    listPortalAssets({ dealershipId, status, q: sp.q?.trim() || undefined }),
    isAdmin ? listDealerships() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-navy-900">{isAdmin ? "Inventory" : "My listings"}</h1>
        <Link href="/portal/assets/new" className="btn-primary">+ Add equipment</Link>
      </div>

      <Form action="/portal/assets" className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-48 flex-1">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={sp.q} placeholder="Title, make, model, stock #, serial" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="input">
            <option value="">All</option>
            {ASSET_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        {isAdmin && (
          <div>
            <label className="label" htmlFor="dealer">Dealership</label>
            <select id="dealer" name="dealer" defaultValue={sp.dealer ?? ""} className="input">
              <option value="">All</option>
              {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
        <button className="btn-navy">Filter</button>
      </Form>

      <div className="card mt-4 overflow-x-auto">
        {assets.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No listings yet.{" "}
            <Link href="/portal/assets/new" className="font-semibold text-brand-600">Add your first unit</Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Equipment</th>
                {isAdmin && <th className="p-3">Dealership</th>}
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <Link href={`/portal/assets/${a.id}`} className="flex items-center gap-3">
                      <span className="h-12 w-16 shrink-0 overflow-hidden rounded bg-sand-100">
                        {a.cover_key && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl(a.cover_key)} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-900">{a.title}</span>
                        <span className="block text-xs text-slate-500">
                          {a.category}{a.stock_number ? ` · Stock ${a.stock_number}` : ""} · {a.photo_count} photo{a.photo_count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  {isAdmin && <td className="p-3 text-slate-700">{a.dealership_name}</td>}
                  <td className="p-3 font-semibold">{money(a.price_cents)}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3 text-slate-500">{date(a.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
