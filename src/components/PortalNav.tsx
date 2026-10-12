"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNav({ links }: { links: [string, string][] }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/portal" ? path === "/portal" : path === href || (path.startsWith(href + "/") && !links.some(([h]) => h !== href && path.startsWith(h) && h.length > href.length));
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-3 text-sm md:flex-col md:px-3">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`whitespace-nowrap rounded-md px-3 py-2 ${active(href) ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
