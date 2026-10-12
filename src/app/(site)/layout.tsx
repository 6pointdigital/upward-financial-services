import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Upward Financial Services equipment inventory">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-3">
            <Link href="/" className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
              Inventory
            </Link>
            <Link href={user ? "/portal" : "/login"} className="btn-ghost whitespace-nowrap !py-2">
              {user ? "Portal" : "Dealer login"}
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-16 bg-navy-950 text-white/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <Logo light />
            <p className="mt-3 max-w-xs text-sm">
              Commercial equipment financing for trucks, construction and heavy equipment from our dealer network.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">For buyers</p>
            <p className="mt-2">Browse inventory, estimate payments, and apply for financing on any listing.</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">For dealers</p>
            <p className="mt-2">
              List your units with Upward.{" "}
              <Link href="/login" className="text-brand-100 underline underline-offset-2">Dealer portal</Link>
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Upward Financial Services. Payment estimates are for illustration only and are
          not an offer of credit. All financing subject to credit approval.
        </div>
      </footer>
    </div>
  );
}
