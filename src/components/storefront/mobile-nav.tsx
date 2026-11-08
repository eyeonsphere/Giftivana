"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { t } from "@/lib/i18n";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-10 items-center justify-center rounded-control text-green-800 hover:bg-green-050"
      >
        <span className="sr-only">{open ? t("nav.closeMenu") : t("nav.openMenu")}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open && (
        <div id={id} ref={panelRef} className="absolute inset-x-0 top-16 border-b border-line bg-ivory shadow-card">
          <nav aria-label="Primary" className="ev-container flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-control px-3 py-3 text-base font-medium text-ink-soft hover:bg-green-050"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/#destination"
              onClick={() => setOpen(false)}
              className="rounded-control px-3 py-3 text-base font-medium text-green-800 hover:bg-green-050"
            >
              {t("destination.change")} {t("destination.label").toLowerCase()}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
