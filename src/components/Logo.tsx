export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? "#ffffff" : "#0b2540"} />
        <path d="M8 22 L15 14 L19 18 L25 10" stroke="#1e9460" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 10 H25 V15" stroke="#1e9460" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`leading-tight ${light ? "text-white" : "text-navy-900"}`}>
        <span className="block text-[15px] font-extrabold tracking-tight">Upward</span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${light ? "text-white/70" : "text-slate-500"}`}>
          Financial Services
        </span>
      </span>
    </span>
  );
}
