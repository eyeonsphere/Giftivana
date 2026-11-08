"use client";

import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/storefront/section";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { containsDigital, containsPhysical, displaySubtotalMinor } from "@/lib/cart/rules";
import { useCart } from "@/lib/cart/store";
import { MAX_QUANTITY } from "@/lib/cart/types";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { Currency } from "@/types/domain";

export function CartView({ currencies, cities }: { currencies: [string, Currency][]; cities: [string, string][] }) {
  const { state, hydrated, remove, setQuantity } = useCart();
  const currencyMap = new Map(currencies);
  const cityName = new Map(cities).get(state.cityId ?? "") ?? "";

  if (!hydrated) return <Skeleton className="h-48" />;

  if (!state.lines.length) {
    return (
      <EmptyState title={t("cart.empty")} body={t("cart.emptyBody")}>
        <ButtonLink href="/gifts">{t("cart.browse")}</ButtonLink>
      </EmptyState>
    );
  }

  const subtotal = displaySubtotalMinor(state);
  const mixed = containsPhysical(state) && containsDigital(state);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <p className="mb-4 text-sm text-ink-muted">{t("cart.forCity", { city: cityName })}</p>
        {mixed && (
          <Notice tone="info" className="mb-4">
            {t("cart.mixedNote")}
          </Notice>
        )}
        <ul className="divide-y divide-line rounded-card border border-line bg-paper">
          {state.lines.map((line) => (
            <li key={line.key} className="flex gap-4 p-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-[12px] bg-ivory-deep">
                {line.imagePath && <Image src={line.imagePath} alt="" fill sizes="80px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={line.productType === "gift_card" ? `/gift-cards/${line.slug}` : `/gifts/${line.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {line.name}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      {line.variantName}
                      {line.faceValueLabel && (
                        <>
                          {t("giftCards.faceValue")}: {line.faceValueLabel}
                        </>
                      )}
                    </p>
                    <Badge tone={line.productType === "gift_card" ? "peach" : "green"} className="mt-1">
                      {line.productType === "gift_card" ? t("cart.digital") : t("cart.physical")}
                    </Badge>
                  </div>
                  <p className="font-semibold">{formatMoney({ amountMinor: line.unitPriceMinor * line.quantity, currency: line.currency }, currencyMap)}</p>
                </div>
                {line.giftMessage && <p className="mt-2 line-clamp-2 text-sm italic text-ink-muted">“{line.giftMessage}”</p>}
                <div className="mt-3 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-ink-muted">{t("product.quantity")}</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_QUANTITY}
                      value={line.quantity}
                      onChange={(e) => setQuantity(line.key, Number(e.target.value))}
                      className="h-9 w-16 rounded-control border border-line-strong bg-paper px-2 text-center"
                    />
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(line.key)}>
                    {t("cart.remove")}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-card border border-line bg-paper p-5 lg:sticky lg:top-24">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{t("cart.subtotal")}</dt>
            <dd className="font-semibold">{subtotal ? formatMoney(subtotal, currencyMap) : "—"}</dd>
          </div>
          <div className="flex justify-between text-ink-muted">
            <dt>{t("cart.deliveryTbd")}</dt>
          </div>
        </dl>
        <Button className="mt-5 w-full" size="lg" disabled title={t("cart.checkoutSoon")}>
          {t("cart.checkout")}
        </Button>
        <p className="mt-2 text-center text-xs text-ink-muted">{t("cart.checkoutSoon")}</p>
      </aside>
    </div>
  );
}
