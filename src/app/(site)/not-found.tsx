import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-extrabold text-navy-900">That listing isn’t available</h1>
      <p className="mt-2 text-slate-600">It may have been sold or removed.</p>
      <Link href="/" className="btn-primary mt-6">Browse inventory</Link>
    </div>
  );
}
