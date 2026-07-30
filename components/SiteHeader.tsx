"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  ["How It Works", "/how-it-works"],
  ["Meet Entrepreneurs", "/sellers"],
  ["Apply", "/seller/register"],
  ["Admin", "/admin/login"]
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-xl font-black leading-tight tracking-normal text-forest sm:gap-4 sm:text-2xl" onClick={() => setOpen(false)}>
            <Image src="/brand/fusbus-logo.png" alt="FusBus logo" width={112} height={112} className="h-24 w-24 shrink-0 rounded-md object-contain sm:h-28 sm:w-28" priority />
            <span className="min-w-0">FusBus Cameroon</span>
          </Link>

          <button
            type="button"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-ink shadow-sm sm:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="grid gap-1.5" aria-hidden="true">
              <span className={`block h-0.5 w-6 rounded-full bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-6 rounded-full bg-current transition ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 rounded-full bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>

          <div className="hidden items-center justify-end gap-2 text-sm font-semibold sm:flex sm:flex-wrap">
            {links.map(([label, href]) => (
              <Link key={href} className="rounded-md px-3 py-2 text-ink hover:bg-stone-100" href={href}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div id="mobile-menu" className={`${open ? "grid" : "hidden"} mt-3 gap-2 border-t border-stone-200 pt-3 text-base font-semibold sm:hidden`}>
          {links.map(([label, href]) => (
            <Link key={href} className="rounded-md px-3 py-3 text-ink hover:bg-stone-100" href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
