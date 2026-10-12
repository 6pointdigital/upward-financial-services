"use client";
import { useState } from "react";
import { photoUrl } from "@/lib/format";

export function Gallery({ keys, title }: { keys: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!keys.length)
    return (
      <div className="card flex aspect-[16/10] items-center justify-center text-slate-400">Photos coming soon</div>
    );
  const prev = () => setI((i - 1 + keys.length) % keys.length);
  const next = () => setI((i + 1) % keys.length);
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-navy-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(keys[i])} alt={`${title} — photo ${i + 1} of ${keys.length}`} className="h-full w-full object-contain" />
        {keys.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous photo" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-bold text-navy-900 shadow hover:bg-white">‹</button>
            <button onClick={next} aria-label="Next photo" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-bold text-navy-900 shadow hover:bg-white">›</button>
            <span className="badge absolute bottom-3 right-3 bg-black/60 text-white">{i + 1} / {keys.length}</span>
          </>
        )}
      </div>
      {keys.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {keys.map((k, idx) => (
            <button
              key={k}
              onClick={() => setI(idx)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${idx === i ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"}`}
              aria-label={`Show photo ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(k)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
