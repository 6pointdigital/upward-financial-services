"use client";
import { useActionState } from "react";
import { submitFinancingRequest, type FinancingState } from "@/app/actions/financing";
import { US_STATES } from "@/lib/constants";

export function FinancingForm({ assetId, assetTitle, terms }: { assetId: number; assetTitle: string; terms: number[] }) {
  const [state, action, pending] = useActionState<FinancingState, FormData>(submitFinancingRequest, {});

  if (state.ok)
    return (
      <div className="card border-brand-500 p-6 text-center" id="apply">
        <p className="text-2xl">✓</p>
        <h2 className="mt-1 text-lg font-bold text-navy-900">Request received</h2>
        <p className="mt-1 text-sm text-slate-600">
          Thanks — an Upward financing specialist will contact you shortly about the {assetTitle}.
        </p>
      </div>
    );

  return (
    <form action={action} className="card scroll-mt-24 p-5" id="apply">
      <h2 className="font-bold text-navy-900">Apply for financing</h2>
      <p className="mt-1 text-sm text-slate-600">Tell us a bit about your business and an Upward financing specialist will follow up.</p>
      <input type="hidden" name="asset_id" value={assetId} />
      <div className="hidden" aria-hidden="true">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="fr-name">Full name *</label>
          <input id="fr-name" name="full_name" required autoComplete="name" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="fr-company">Business name</label>
          <input id="fr-company" name="company" autoComplete="organization" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="fr-email">Email *</label>
          <input id="fr-email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="fr-phone">Phone *</label>
          <input id="fr-phone" name="phone" type="tel" required autoComplete="tel" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="fr-state">State</label>
          <select id="fr-state" name="state" className="input" defaultValue="">
            <option value="">Select</option>
            {US_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="fr-yib">Time in business</label>
          <select id="fr-yib" name="years_in_business" className="input" defaultValue="">
            <option value="">Select</option>
            <option>Startup / &lt;1 yr</option>
            <option>1–2 yrs</option>
            <option>2–5 yrs</option>
            <option>5+ yrs</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="fr-down">Down payment ($)</label>
          <input id="fr-down" name="down_payment" inputMode="decimal" className="input" placeholder="Optional" />
        </div>
        <div>
          <label className="label" htmlFor="fr-term">Preferred term</label>
          <select id="fr-term" name="term_months" className="input" defaultValue="">
            <option value="">No preference</option>
            {terms.map((t) => <option key={t} value={t}>{t} months</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="fr-msg">Anything else?</label>
          <textarea id="fr-msg" name="message" rows={3} className="input" />
        </div>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[#16794d]" />
        I agree Upward Financial Services may contact me by phone or email about financing this equipment.
      </label>
      {state.error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn-primary mt-4 w-full">{pending ? "Sending…" : "Submit financing request"}</button>
    </form>
  );
}
