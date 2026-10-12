import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/env";
import { listPortalAssets, statusCounts } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { date, money } from "@/lib/format";

export default async function Dashboard() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const dealerId = isAdmin ? null : user.dealership_id;
  const counts = await statusCounts(dealerId);
  const pending = isAdmin ? (await listPortalAssets({ status: "pending" })).slice(0, 8) : [];
  const rejected = !isAdmin ? await listPortalAssets({ dealershipId: dealerId, status: "rejected" }) : [];
  const db = await getDb();
  const newRequests = isAdmin
    ? (await db.prepare("SELECT COUNT(*) AS n FROM financing_requests WHERE status = 'new'").first<{ n: number }>())?.n ?? 0
    : 0;

  const tiles: [string, number, string][] = [
    ["Live listings", counts.approved ?? 0, "/portal/assets?status=approved"],
    ["Pending review", counts.pending ?? 0, "/portal/assets?status=pending"],
    ["Drafts", counts.draft ?? 0, "/portal/assets?status=draft"],
    ...(isAdmin
      ? ([["New financing requests", newRequests, "/portal/requests"]] as [string, number, string][])
      : ([["Needs changes", counts.rejected ?? 0, "/portal/assets?status=rejected"]] as [string, number, string][])),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-600">{isAdmin ? "Upward Financial Services · Admin" : user.dealership_name}</p>
        </div>
        <Link href="/portal/assets/new" className="btn-primary">+ Add equipment</Link>
      </div>

      {!isAdmin && !user.dealership_id && (
        <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Your account isn’t linked to a dealership yet. Ask your Upward contact to finish setting it up.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, n, href]) => (
          <Link key={label} href={href} className="card p-5 transition hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-navy-900">{n}</p>
          </Link>
        ))}
      </div>

      {isAdmin && (
        <section className="card mt-8">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="font-bold text-navy-900">Approval queue</h2>
            <Link href="/portal/assets?status=pending" className="text-sm font-semibold text-brand-600">View all</Link>
          </div>
          {pending.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nothing waiting for review.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((a) => (
                <li key={a.id}>
                  <Link href={`/portal/assets/${a.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.dealership_name} · submitted {date(a.updated_at)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-navy-900">{money(a.price_cents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {rejected.length > 0 && (
        <section className="card mt-8">
          <h2 className="border-b border-slate-100 p-4 font-bold text-navy-900">Listings that need changes</h2>
          <ul className="divide-y divide-slate-100">
            {rejected.map((a) => (
              <li key={a.id}>
                <Link href={`/portal/assets/${a.id}`} className="block p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{a.title}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.review_note && <p className="mt-1 text-sm text-red-700">“{a.review_note}”</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
