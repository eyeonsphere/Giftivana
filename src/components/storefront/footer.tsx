import Link from "next/link";
import { t } from "@/lib/i18n";
import { Logo } from "./logo";

const groups = [
  {
    title: "footer.shop",
    links: [
      ["/gifts", "nav.gifts"],
      ["/gift-cards", "nav.giftCards"],
      ["/occasions", "nav.occasions"],
    ],
  },
  {
    title: "footer.help",
    links: [
      ["/delivery", "footer.delivery"],
      ["/faq", "footer.faq"],
      ["/contact", "footer.contact"],
      ["/about", "footer.about"],
    ],
  },
  {
    title: "footer.legal",
    links: [
      ["/legal/privacy", "footer.privacy"],
      ["/legal/terms", "footer.terms"],
      ["/legal/gift-card-terms", "footer.giftCardTerms"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-ivory-deep/60">
      <div className="ev-container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-soft">{t("brand.tagline")}</p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={t(g.title)}>
            <h2 className="font-sans text-sm font-semibold text-ink">{t(g.title)}</h2>
            <ul className="mt-3 space-y-2">
              {g.links.map(([href, key]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-soft hover:text-green-800 hover:underline">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="ev-container flex flex-col gap-2 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {t("brand.name")}</p>
          <p>{t("footer.legalNote")}</p>
        </div>
      </div>
    </footer>
  );
}
