import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
import { defaultLocale, dir, t } from "@/lib/i18n";

const CartProvider = dynamic(
  () => import("@/lib/cart/store").then((m) => m.CartProvider),
  { ssr: false },
);

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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
