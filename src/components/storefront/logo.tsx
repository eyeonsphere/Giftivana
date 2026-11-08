import Link from "next/link";
import { t } from "@/lib/i18n";

/** Wordmark: the brand name in the display face. No image asset needed. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`font-display text-[1.6rem] font-medium tracking-tight text-green-800 ${className}`} aria-label={`${t("brand.name")} home`}>
      {t("brand.name")}
    </Link>
  );
}
