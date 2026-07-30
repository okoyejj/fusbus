import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "FusBus Cameroon Entrepreneur Platform",
  description: "Onboarding Cameroonian entrepreneurs for international visibility, support, and investment."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3" href="#main">
          Skip to content
        </a>
        <SiteHeader />
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
