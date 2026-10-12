import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/env";
import { updateRequestStatus } from "@/app/actions/admin";
import { date, money } from "@/lib/format";

type R = {
  id: number; asset_id: number | null; asset_title: string | null; asset_price: number | null; dealership_name: string | null;
  full_name: string; company: string | null; email: string; phone: string | null; state: string | null;
  down_payment_cents: number | null; term_months: number | null; years_in_business: string | null; message: string | null;
  status: "new" | "contacted" | "closed"; created_at: string;
};
const LABEL = { new: "New", contacted: "Contacted", closed: "Closed" } as const;
const COLOR = { new: "bg-brand-100 text-brand-600", contacted: "bg-amber-100 text-amber-800", closed: "bg-slate-100 text-slate-600" } as const;

export default async function Requests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const status = (await searchParams).status;
  const filter = status && status in LABEL ? status : null;
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT r.*, a.title AS asset_title, a.price_cents AS asset_price, d.name AS dealership_name
       FROM financing_requests r LEFT JOIN assets a ON a.id = r.asset_id LEFT JOIN dealerships d ON d.id = a.dealership_id
       ${filter ? "WHERE r.status = ?" : ""} ORDER BY r.status = 'new' DESC, r.created_at DESC LIMIT 300`,
    )
    .bind(...(filter ? [filter] : []))
    .all<R>();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold text-navy-900">Financing requests</h1>
      <div className="mt-4 flex gap-1 text-sm">
        {[["", "All"], ["new", "New"], ["contacted", "Contacted"], ["closed", "Closed"]].map(([v, l]) => (
          <Link key={v} href={v ? `/portal/requests?status=${v}` : "/portal/requests"} className={`rounded-md px-3 py-1.5 ${(filter ?? "") === v ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-200"}`}>{l}</Link>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {rows.results.length === 0 && <div className="card p-10 text-center text-sm text-slate-500">No financing requests yet.</div>}
        {rows.results.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{r.full_name}{r.company ? ` · ${r.company}` : ""}</p>
                <p className="text-sm">
                  <a className="text-brand-600 underline" href={`mailto:${r.email}`}>{r.email}</a>
                  {r.phone && <> · <a className="text-brand-600 underline" href={`tel:${r.phone}`}>{r.phone}</a></>}
                  {r.state && <span className="text-slate-500"> · {r.state}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${COLOR[r.status]}`}>{LABEL[r.status]}</span>
                <span className="text-xs text-slate-500">{date(r.created_at)}</span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-4">
              <p className="sm:col-span-2"><span className="text-slate-500">Equipment: </span>
                {r.asset_id ? <Link className="font-semibold underline" href={`/portal/assets/${r.asset_id}`}>{r.asset_title}</Link> : "—"}
                {r.asset_price != null && <span className="text-slate-500"> ({money(r.asset_price)}{r.dealership_name ? ` · ${r.dealership_name}` : ""})</span>}
              </p>
              <p><span className="text-slate-500">Down: </span>{r.down_payment_cents != null ? money(r.down_payment_cents) : "—"}</p>
              <p><span className="text-slate-500">Term: </span>{r.term_months ? `${r.term_months} mo` : "—"} · <span className="text-slate-500">TIB: </span>{r.years_in_business ?? "—"}</p>
            </div>
            {r.message && <p className="mt-2 whitespace-pre-line rounded-md bg-sand-50 p-3 text-sm text-slate-700">{r.message}</p>}
            <form className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={r.id} />
              {(["new", "contacted", "closed"] as const).filter((s) => s !== r.status).map((s) => (
                <button key={s} formAction={updateRequestStatus.bind(null, s)} className="btn-ghost !px-3 !py-1.5 text-xs">Mark {LABEL[s].toLowerCase()}</button>
              ))}
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
