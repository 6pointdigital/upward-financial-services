"use client";
import { useActionState, useRef } from "react";
import { saveAsset, type AssetFormState } from "@/app/actions/assets";
import { CATEGORIES, US_STATES } from "@/lib/constants";
import type { Asset, Dealership } from "@/lib/data";

export function AssetForm({
  asset,
  isAdmin,
  dealerships,
}: {
  asset?: Asset;
  isAdmin: boolean;
  dealerships: Pick<Dealership, "id" | "name">[];
}) {
  const [state, action, pending] = useActionState<AssetFormState, FormData>(saveAsset, {});
  const intent = useRef<HTMLInputElement>(null);
  const setIntent = (v: string) => () => { if (intent.current) intent.current.value = v; };
  const v = (k: keyof Asset) => (asset?.[k] ?? "") as string | number;
  const isLiveDealerEdit = !isAdmin && asset && (asset.status === "approved" || asset.status === "pending");

  return (
    <form action={action} className="card p-5">
      {asset && <input type="hidden" name="id" value={asset.id} />}
      <input ref={intent} type="hidden" name="intent" defaultValue="save" />
      <div className="grid gap-4 sm:grid-cols-6">
        {isAdmin && (
          <div className="sm:col-span-6">
            <label className="label" htmlFor="a-dealer">Dealership *</label>
            <select id="a-dealer" name="dealership_id" required defaultValue={v("dealership_id")} className="input">
              <option value="">Select dealership</option>
              {dealerships.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
        <div className="sm:col-span-6">
          <label className="label" htmlFor="a-title">Listing title *</label>
          <input id="a-title" name="title" required maxLength={140} defaultValue={v("title")} placeholder="2019 Caterpillar D6T XL Crawler Dozer" className="input" />
        </div>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="a-cat">Category *</label>
          <select id="a-cat" name="category" required defaultValue={v("category")} className="input">
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-3">
          <span className="label">Condition</span>
          <div className="flex gap-4 pt-2 text-sm">
            {["used", "new"].map((c) => (
              <label key={c} className="flex items-center gap-2">
                <input type="radio" name="condition" value={c} defaultChecked={(asset?.condition ?? "used") === c} className="accent-[#16794d]" />
                {c === "new" ? "New" : "Used"}
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-year">Year</label>
          <input id="a-year" name="year" inputMode="numeric" defaultValue={v("year")} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-make">Make</label>
          <input id="a-make" name="make" defaultValue={v("make")} placeholder="Caterpillar" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-model">Model</label>
          <input id="a-model" name="model" defaultValue={v("model")} placeholder="D6T XL" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-price">Price (USD)</label>
          <input id="a-price" name="price" inputMode="decimal" defaultValue={asset?.price_cents != null ? asset.price_cents / 100 : ""} placeholder="185000" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-hours">Hours</label>
          <input id="a-hours" name="hours" inputMode="numeric" defaultValue={v("hours")} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-miles">Mileage</label>
          <input id="a-miles" name="mileage" inputMode="numeric" defaultValue={v("mileage")} className="input" />
        </div>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="a-serial">Serial # / VIN</label>
          <input id="a-serial" name="serial_number" defaultValue={v("serial_number")} className="input" />
        </div>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="a-stock">Dealer stock #</label>
          <input id="a-stock" name="stock_number" defaultValue={v("stock_number")} className="input" />
        </div>
        <div className="sm:col-span-4">
          <label className="label" htmlFor="a-city">Unit location — city</label>
          <input id="a-city" name="location_city" defaultValue={v("location_city")} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-state">State</label>
          <select id="a-state" name="location_state" defaultValue={v("location_state")} className="input">
            <option value="">—</option>
            {US_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-6">
          <label className="label" htmlFor="a-desc">Description</label>
          <textarea id="a-desc" name="description" rows={7} defaultValue={v("description")} placeholder="Features, attachments, service history, condition notes…" className="input" />
        </div>
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm sm:col-span-6">
            <input type="checkbox" name="financing_eligible" defaultChecked={asset ? !!asset.financing_eligible : true} className="accent-[#16794d]" />
            Eligible for Upward financing (shows estimator & application on the listing)
          </label>
        )}
      </div>

      {state.error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>}
      {state.saved && <p className="mt-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-600" role="status">Saved.</p>}
      {isLiveDealerEdit && (
        <p className="mt-4 text-xs text-slate-500">Saving changes sends this listing back to Upward for a quick re-review.</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
        {isAdmin ? (
          <button onClick={setIntent("save")} disabled={pending} className="btn-navy">{pending ? "Saving…" : asset ? "Save changes" : "Create listing"}</button>
        ) : !asset ? (
          <button onClick={setIntent("draft")} disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save & continue to photos"}</button>
        ) : (
          <>
            <button onClick={setIntent("submit")} disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save & submit for review"}</button>
            <button onClick={setIntent("draft")} disabled={pending} className="btn-ghost">Save as draft</button>
          </>
        )}
      </div>
      {!asset && <p className="mt-3 text-xs text-slate-500">You can add photos after the listing is created.</p>}
    </form>
  );
}
