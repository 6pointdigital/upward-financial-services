import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listDealerships, getDealership } from "@/lib/data";
import { saveDealership } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { US_STATES } from "@/lib/constants";

export default async function Dealerships({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin();
  const editId = Number((await searchParams).edit) || null;
  const [dealers, editing] = await Promise.all([listDealerships(), editId ? getDealership(editId) : null]);
  const d = editing;
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold text-navy-900">Dealerships</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Dealership</th><th className="p-3">Contact</th><th className="p-3">Listings</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dealers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No dealerships yet — add one to get started.</td></tr>}
              {dealers.map((x) => (
                <tr key={x.id} className={x.active ? "" : "opacity-50"}>
                  <td className="p-3">
                    <p className="font-semibold text-slate-900">{x.name}{!x.active && " (inactive)"}</p>
                    <p className="text-xs text-slate-500">{[x.city, x.state].filter(Boolean).join(", ")}</p>
                  </td>
                  <td className="p-3 text-slate-600">
                    {x.contact_name}<br /><span className="text-xs">{x.email}{x.phone ? ` · ${x.phone}` : ""}</span>
                  </td>
                  <td className="p-3"><Link className="font-semibold text-brand-600" href={`/portal/assets?dealer=${x.id}`}>{x.asset_count}</Link></td>
                  <td className="p-3 text-right"><Link className="text-sm font-semibold text-navy-900 underline" href={`/portal/dealerships?edit=${x.id}`}>Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-navy-900">{d ? "Edit dealership" : "Add dealership"}</h2>
            {d && <Link href="/portal/dealerships" className="text-xs font-semibold text-slate-500">Cancel</Link>}
          </div>
          <ActionForm key={d?.id ?? "new"} action={saveDealership} submit={d ? "Save" : "Add dealership"} className="mt-4 space-y-3" resetOnSuccess={!d}>
            {d && <input type="hidden" name="id" value={d.id} />}
            <div><label className="label" htmlFor="d-name">Name *</label><input id="d-name" name="name" required defaultValue={d?.name} className="input" /></div>
            <div><label className="label" htmlFor="d-contact">Contact name</label><input id="d-contact" name="contact_name" defaultValue={d?.contact_name ?? ""} className="input" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label" htmlFor="d-email">Email</label><input id="d-email" name="email" type="email" defaultValue={d?.email ?? ""} className="input" /></div>
              <div><label className="label" htmlFor="d-phone">Phone</label><input id="d-phone" name="phone" defaultValue={d?.phone ?? ""} className="input" /></div>
            </div>
            <div><label className="label" htmlFor="d-web">Website</label><input id="d-web" name="website" defaultValue={d?.website ?? ""} className="input" /></div>
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <div><label className="label" htmlFor="d-city">City</label><input id="d-city" name="city" defaultValue={d?.city ?? ""} className="input" /></div>
              <div><label className="label" htmlFor="d-state">State</label>
                <select id="d-state" name="state" defaultValue={d?.state ?? ""} className="input"><option value="">—</option>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={d ? !!d.active : true} className="accent-[#16794d]" /> Active (inactive hides all its listings)</label>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
