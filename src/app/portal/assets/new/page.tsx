import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDealerships } from "@/lib/data";
import { AssetForm } from "@/components/AssetForm";

export default async function NewAsset() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const dealers = isAdmin ? await listDealerships(true) : [];
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/portal/assets" className="text-sm text-slate-500 hover:text-navy-900">← Back to listings</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-navy-900">Add equipment</h1>
      {isAdmin && dealers.length === 0 ? (
        <div className="card mt-6 p-6 text-sm">
          Add a dealership first. <Link href="/portal/dealerships" className="font-semibold text-brand-600">Manage dealerships →</Link>
        </div>
      ) : !isAdmin && !user.dealership_id ? (
        <div className="card mt-6 p-6 text-sm">Your account isn’t linked to a dealership yet. Contact Upward.</div>
      ) : (
        <div className="mt-6">
          <AssetForm isAdmin={isAdmin} dealerships={dealers} />
        </div>
      )}
    </div>
  );
}
