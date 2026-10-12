"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { makeCoverPhoto } from "@/app/actions/assets";
import { photoUrl, withBase } from "@/lib/format";
import { MAX_PHOTOS } from "@/lib/constants";

type P = { id: number; r2_key: string };

/** Downscale large photos in the browser so uploads stay fast and storage stays lean. */
async function prepare(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn’t an image.`);
  try {
    const bmp = await createImageBitmap(file);
    const max = 2000;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024 && file.type !== "image/heic") return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not process image"))), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}

export function PhotoManager({ assetId, photos }: { assetId: number; photos: P[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function upload(files: FileList | File[]) {
    setError(null);
    const list = [...files].slice(0, Math.max(0, MAX_PHOTOS - photos.length));
    if (!list.length) return setError(`Maximum ${MAX_PHOTOS} photos per listing.`);
    for (let i = 0; i < list.length; i++) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const blob = await prepare(list[i]);
        const fd = new FormData();
        fd.append("file", blob, list[i].name);
        const r = await fetch(withBase(`/api/assets/${assetId}/photos`), { method: "POST", body: fd });
        if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Upload failed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        break;
      }
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Delete this photo?")) return;
    setBusy("Deleting…");
    await fetch(withBase(`/api/assets/${assetId}/photos?photo=${id}`), { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-navy-900">Photos <span className="font-normal text-slate-500">({photos.length}/{MAX_PHOTOS})</span></h2>
        {busy && <span className="text-sm text-slate-500" role="status">{busy}</span>}
      </div>
      <p className="mt-1 text-xs text-slate-500">The first photo is the cover image. Exterior, cab/interior, engine, undercarriage and hour meter shots help approval.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <div key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-sand-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(p.r2_key)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <span className="badge absolute left-2 top-2 bg-brand-600 text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {i !== 0 ? (
                <form action={makeCoverPhoto}>
                  <input type="hidden" name="asset_id" value={assetId} />
                  <input type="hidden" name="photo_id" value={p.id} />
                  <button className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-navy-900">Make cover</button>
                </form>
              ) : <span />}
              <button onClick={() => remove(p.id)} className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-red-700">Delete</button>
            </div>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
            disabled={!!busy}
            className={`flex aspect-[4/3] flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm transition ${drag ? "border-brand-500 bg-brand-50" : "border-slate-300 text-slate-500 hover:border-brand-500 hover:text-brand-600"}`}
          >
            <span className="text-2xl">+</span>
            Add photos
            <span className="text-xs">or drag & drop</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
