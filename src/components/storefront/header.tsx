import Link from "next/link";
import { Suspense } from "react";
import { getCurrentDestination } from "@/lib/destination/server";
import { t } from "@/lib/i18n";
import { CartLink } from "./cart-link";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

const links = [
  { href: "/gifts", key: "nav.gifts" },
  { href: "/gift-cards", key: "nav.giftCards" },
  { href: "/occasions", key: "nav.occasions" },
  { href: "/delivery", key: "nav.delivery" },
];

/** Reads the destination cookie — must stay inside Suspense (runtime API). */
async function DestinationChip() {
  const destination = await getCurrentDestination();
  return (
    <Link
      href="/#destination"
      className="hidden items-center gap-2 rounded-pill border border-line bg-paper px-3 py-1.5 text-sm text-ink-soft hover:border-green-200 hover:bg-green-050 md:inline-flex"
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-green-500" />
      {destination ? (
        <span>
          <span className="text-ink-muted">{t("destination.current")} </span>
          <span className="font-medium text-ink">
            {destination.city.name}, {destination.country.name}
          </span>
        </span>
      ) : (
        <span className="font-medium">{t("destination.none")}</span>
      )}
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-control focus:bg-green-800 focus:px-3 focus:py-2 focus:text-ivory"
      >
        {t("nav.skipToContent")}
      </a>
      <div className="ev-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-control px-3 py-2 text-[15px] font-medium text-ink-soft hover:bg-green-050 hover:text-green-800"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={<span className="hidden h-8 w-40 rounded-pill bg-ivory-deep md:block" />}>
            <DestinationChip />
          </Suspense>
          <CartLink />
          <MobileNav links={links.map((l) => ({ href: l.href, label: t(l.key) }))} />
        </div>
      </div>
    </header>
  );
}
