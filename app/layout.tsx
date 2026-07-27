import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FusBus Cameroon Entrepreneur Platform",
  description: "Onboarding Cameroonian entrepreneurs for international visibility, support, and investment."
};

const links = [
  ["How It Works", "/how-it-works"],
  ["Meet Entrepreneurs", "/sellers"],
  ["Apply", "/seller/register"],
  ["Admin", "/admin/login"]
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3" href="#main">
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8" aria-label="Main navigation">
            <Link href="/" className="flex items-center justify-center gap-4 text-xl font-black leading-tight tracking-normal text-forest sm:justify-start sm:text-2xl">
              <Image src="/brand/fusbus-logo.png" alt="FusBus logo" width={112} height={112} className="h-24 w-24 shrink-0 rounded-md object-contain sm:h-28 sm:w-28" priority />
              <span>FusBus Cameroon</span>
            </Link>
            <div className="-mx-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap px-4 pb-1 text-sm font-semibold sm:mx-0 sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0 sm:pb-0">
              {links.map(([label, href]) => (
                <Link key={href} className="shrink-0 rounded-md px-3 py-2 text-ink hover:bg-stone-100" href={href}>
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-stone-700 sm:grid-cols-3 sm:px-6 lg:px-8">
            <p>Opening Cameroon to the world through verified entrepreneur visibility.</p>
            <Link href="/privacy" className="font-semibold text-forest">Privacy Policy</Link>
            <Link href="/terms" className="font-semibold text-forest">Terms and Conditions</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
