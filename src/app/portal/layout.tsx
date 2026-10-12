import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/auth";
import { PortalNav } from "@/components/PortalNav";
import { withBase } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal", robots: { index: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const links =
    user.role === "admin"
      ? [
          ["/portal", "Dashboard"],
          ["/portal/assets", "Inventory"],
          ["/portal/requests", "Financing requests"],
          ["/portal/dealerships", "Dealerships"],
          ["/portal/users", "Users"],
          ["/portal/settings", "Settings"],
        ]
      : [
          ["/portal", "Dashboard"],
          ["/portal/assets", "My listings"],
          ["/portal/assets/new", "Add equipment"],
        ];
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="relative bg-navy-950 text-white md:sticky md:top-0 md:h-screen md:self-start">
        <div className="flex items-center justify-between p-4 md:block">
          <Link href="/portal"><Logo light /></Link>
          <div className="mt-0 text-right text-xs text-white/60 md:mt-6 md:text-left">
            <p className="font-semibold text-white">{user.name}</p>
            <p>{user.role === "admin" ? "Upward admin" : user.dealership_name ?? "Dealer"}</p>
          </div>
        </div>
        <PortalNav links={links as [string, string][]} />
        <div className="flex gap-2 px-4 pb-4 text-xs md:absolute md:bottom-0 md:flex-col">
          <Link href="/" className="text-white/60 hover:text-white">View public site ↗</Link>
          <Link href="/portal/account" className="text-white/60 hover:text-white">My account</Link>
          <form action={withBase("/logout")} method="post">
            <button className="text-white/60 hover:text-white">Log out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 bg-sand-50 p-4 sm:p-8">{children}</main>
    </div>
  );
}
