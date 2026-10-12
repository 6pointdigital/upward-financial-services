import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { saveSettings } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";

export default async function Settings() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold text-navy-900">Payment estimator settings</h1>
      <p className="mt-1 text-sm text-slate-600">Defaults used for the monthly estimates shown on listings. Buyers can adjust down payment, term and rate on each listing.</p>
      <ActionForm action={saveSettings} submit="Save settings" className="card mt-6 space-y-4 p-5">
        <div><label className="label" htmlFor="apr">Default APR (%)</label><input id="apr" name="estimator_apr" type="number" step="0.01" min={0} max={40} defaultValue={s.estimator_apr} className="input" /></div>
        <div><label className="label" htmlFor="down">Default down payment (%)</label><input id="down" name="estimator_default_down_pct" type="number" step="1" min={0} max={90} defaultValue={s.estimator_default_down_pct} className="input" /></div>
        <div><label className="label" htmlFor="terms">Available terms (months, comma-separated)</label><input id="terms" name="estimator_terms" defaultValue={s.estimator_terms.join(", ")} className="input" />
          <p className="mt-1 text-xs text-slate-500">The longest term is used for the “est. /mo” shown on inventory cards.</p></div>
      </ActionForm>
    </div>
  );
}
