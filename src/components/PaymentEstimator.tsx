"use client";
import { useMemo, useState } from "react";
import { monthlyPayment } from "@/lib/format";

const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

export function PaymentEstimator({
  price,
  apr: defaultApr,
  terms,
  downPct,
}: {
  price: number;
  apr: number;
  terms: number[];
  downPct: number;
}) {
  const [down, setDown] = useState(Math.round((price * downPct) / 100));
  const [term, setTerm] = useState(terms.includes(60) ? 60 : terms[terms.length - 1]);
  const [apr, setApr] = useState(defaultApr);

  const financed = Math.max(0, price - down);
  const payment = useMemo(() => monthlyPayment(financed, apr, term), [financed, apr, term]);
  const totalInterest = Math.max(0, payment * term - financed);

  return (
    <div className="card p-5" id="estimator">
      <h2 className="font-bold text-navy-900">Estimate your payment</h2>
      <div className="mt-4 rounded-lg bg-brand-50 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Estimated monthly payment</p>
        <p className="mt-1 text-4xl font-extrabold text-navy-900" aria-live="polite">{fmt(payment)}</p>
        <p className="mt-1 text-xs text-slate-600">
          {fmt(financed)} financed · {fmt(totalInterest)} est. interest
        </p>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="label !mb-0" htmlFor="est-down">Down payment</label>
            <span className="text-sm font-semibold text-navy-900">
              {fmt(down)} <span className="text-xs font-normal text-slate-500">({price ? Math.round((down / price) * 100) : 0}%)</span>
            </span>
          </div>
          <input
            id="est-down"
            type="range"
            min={0}
            max={Math.round(price * 0.5)}
            step={Math.max(100, Math.round(price / 200 / 100) * 100)}
            value={down}
            onChange={(e) => setDown(Number(e.target.value))}
            className="mt-2 w-full accent-[#16794d]"
          />
        </div>
        <div>
          <span className="label">Term</span>
          <div className="flex flex-wrap gap-1.5">
            {terms.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                  t === term ? "border-navy-900 bg-navy-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-pressed={t === term}
              >
                {t} mo
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="est-apr">Interest rate (APR %)</label>
          <input
            id="est-apr"
            type="number"
            min={0}
            max={40}
            step={0.25}
            value={apr}
            onChange={(e) => setApr(Math.min(40, Math.max(0, Number(e.target.value) || 0)))}
            className="input"
          />
        </div>
      </div>
      <a href="#apply" className="btn-primary mt-5 w-full">Apply for financing</a>
      <p className="mt-3 text-[11px] leading-snug text-slate-500">
        For illustration only. Not an offer of credit. Your actual rate, term and payment depend on credit approval,
        time in business and the equipment financed.
      </p>
    </div>
  );
}
