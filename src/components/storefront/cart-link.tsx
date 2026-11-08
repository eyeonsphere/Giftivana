"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import { t } from "@/lib/i18n";

export function CartLink() {
  const { count, hydrated } = useCart();
  const label = count > 0 ? `${t("nav.cart")}, ${count} item${count === 1 ? "" : "s"}` : t("nav.cart");
  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex size-10 items-center justify-center rounded-control text-green-800 hover:bg-green-050"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.8h-9a2 2 0 0 1-2-1.8L4 7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 10V6a3 3 0 0 1 6 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {hydrated && count > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-pill bg-peach-300 px-1 text-[11px] font-semibold text-ink"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
