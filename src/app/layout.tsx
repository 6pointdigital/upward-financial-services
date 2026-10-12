import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Equipment Inventory | Upward Financial Services", template: "%s | Upward Financial Services" },
  description:
    "Browse commercial trucks, construction and heavy equipment from our dealer network — and finance it with Upward Financial Services.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
