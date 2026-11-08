import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Section } from "@/components/storefront/section";
import { getCities, getCurrencies } from "@/lib/catalog/queries";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("cart.title") };

/**
 * Stage 2 preview of the cart. Stage 4 adds server re-pricing, delivery fees
 * by zone, compatibility checks and the checkout flow.
 */
export default async function CartPage() {
  const [currencies, cities] = await Promise.all([getCurrencies(), getCities()]);
  return (
    <Section>
      <h1>{t("cart.title")}</h1>
      <div className="mt-8">
        <CartView currencies={currencies.map((c) => [c.code, c])} cities={cities.map((c) => [c.id, c.name])} />
      </div>
    </Section>
  );
}
