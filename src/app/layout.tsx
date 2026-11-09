import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { defaultLocale, dir, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: `${t("brand.name")} — ${t("brand.tagline")}`,
    template: `%s · ${t("brand.name")}`,
  },
  description: t("home.heroBody"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} dir={dir(defaultLocale)}>
      <body suppressHydrationWarning>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
